from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.database import get_db
from app.models.plan import Plan
from app.models.subscription import Subscription
from app.models.usage_event import UsageEvent
from app.models.user import User
from app.schemas.generate import GenerateRequest
from app.services.meter_service import calculate_usage
from app.services.quota_service import check_quota
from app.services.tenant_service import ensure_billing_for_user

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.post("/generate")
def generate(
    request: GenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Resolve the authenticated user's tenant before accessing usage events.
    tenant = ensure_billing_for_user(db, current_user)

    if str(request.tenant_id) != str(tenant.id):
        raise HTTPException(
            status_code=403,
            detail="Access to this tenant is forbidden",
        )

    # Idempotency keys are scoped to the verified tenant.
    existing_event = db.scalar(
        select(UsageEvent).where(
            UsageEvent.tenant_id == tenant.id,
            UsageEvent.idempotency_key == request.idempotency_key,
        )
    )

    if existing_event:
        usage = {
            "input_tokens": existing_event.input_tokens,
            "cached_input_tokens": existing_event.cached_input_tokens,
            "reasoning_tokens": existing_event.reasoning_tokens,
            "output_tokens": existing_event.output_tokens,
            "total_billable_tokens": existing_event.total_billable_tokens,
        }

        return {
            "success": True,
            "message": "Generation completed",
            "tenant_id": existing_event.tenant_id,
            "usage": usage,
            "idempotency_key": existing_event.idempotency_key,
            "idempotent_replay": True,
        }

    usage = calculate_usage(
        input_tokens=request.input_tokens,
        cached_input_tokens=request.cached_input_tokens,
        reasoning_tokens=request.reasoning_tokens,
        output_tokens=request.output_tokens,
    )

    subscription = db.scalar(
        select(Subscription).where(
            Subscription.tenant_id == tenant.id
        )
    )

    if not subscription:
        raise HTTPException(
            status_code=404,
            detail="Tenant subscription not found",
        )

    plan = db.scalar(
        select(Plan).where(Plan.id == subscription.plan_id)
    )

    if not plan:
        raise HTTPException(
            status_code=404,
            detail="Tenant plan not found",
        )

    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)

    next_month = (
        datetime(now.year + 1, 1, 1)
        if now.month == 12
        else datetime(now.year, now.month + 1, 1)
    )

    api_calls_used = db.scalar(
        select(func.count(UsageEvent.id)).where(
            UsageEvent.tenant_id == tenant.id,
            UsageEvent.created_at >= month_start,
            UsageEvent.created_at < next_month,
        )
    ) or 0

    tokens_used = db.scalar(
        select(
            func.coalesce(
                func.sum(UsageEvent.total_billable_tokens),
                0,
            )
        ).where(
            UsageEvent.tenant_id == tenant.id,
            UsageEvent.created_at >= month_start,
            UsageEvent.created_at < next_month,
        )
    ) or 0

    quota = check_quota(
        api_calls_used=api_calls_used,
        tokens_used=tokens_used,
        requested_tokens=usage["total_billable_tokens"],
        api_call_limit=plan.api_call_limit,
        token_limit=plan.token_limit,
    )

    if not quota["allowed"]:
        raise HTTPException(
            status_code=quota["status_code"],
            detail=quota["reason"],
        )

    event = UsageEvent(
        tenant_id=tenant.id,
        idempotency_key=request.idempotency_key,
        input_tokens=request.input_tokens,
        cached_input_tokens=request.cached_input_tokens,
        reasoning_tokens=request.reasoning_tokens,
        output_tokens=request.output_tokens,
        total_billable_tokens=usage["total_billable_tokens"],
    )

    db.add(event)

    try:
        db.commit()
        db.refresh(event)

    except IntegrityError:
        db.rollback()

        existing_event = db.scalar(
            select(UsageEvent).where(
                UsageEvent.tenant_id == tenant.id,
                UsageEvent.idempotency_key == request.idempotency_key,
            )
        )

        if existing_event is None:
            raise HTTPException(
                status_code=409,
                detail="Idempotency key conflict; retry the request",
            )

        usage = {
            "input_tokens": existing_event.input_tokens,
            "cached_input_tokens": existing_event.cached_input_tokens,
            "reasoning_tokens": existing_event.reasoning_tokens,
            "output_tokens": existing_event.output_tokens,
            "total_billable_tokens": existing_event.total_billable_tokens,
        }

        return {
            "success": True,
            "message": "Generation completed",
            "tenant_id": existing_event.tenant_id,
            "usage": usage,
            "idempotency_key": existing_event.idempotency_key,
            "idempotent_replay": True,
        }

    return {
        "success": True,
        "message": "Generation completed",
        "tenant_id": tenant.id,
        "usage": usage,
        "plan": {
            "id": plan.id,
            "name": plan.name,
            "api_call_limit": plan.api_call_limit,
            "token_limit": plan.token_limit,
        },
        "quota": quota,
        "idempotency_key": request.idempotency_key,
        "idempotent_replay": False,
    }
