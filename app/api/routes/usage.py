from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.database import get_db
from app.models.plan import Plan
from app.models.subscription import Subscription
from app.models.usage_event import UsageEvent
from app.models.user import User
from app.services.billing_service import calculate_total_cost
from app.services.tenant_service import ensure_billing_for_user

router = APIRouter()


def build_usage_response(tenant_id: str, db: Session) -> dict:
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)
    next_month = (
        datetime(now.year + 1, 1, 1)
        if now.month == 12
        else datetime(now.year, now.month + 1, 1)
    )

    subscription = db.scalar(
        select(Subscription).where(Subscription.tenant_id == tenant_id)
    )
    if subscription is None:
        raise HTTPException(status_code=404, detail="Subscription not found")

    plan = db.get(Plan, subscription.plan_id)
    if plan is None:
        raise HTTPException(status_code=503, detail="Subscription plan not found")

    events = db.scalars(
        select(UsageEvent).where(
            UsageEvent.tenant_id == tenant_id,
            UsageEvent.created_at >= month_start,
            UsageEvent.created_at < next_month,
        )
    ).all()

    api_calls = len(events)
    input_tokens = sum(event.input_tokens for event in events)
    cached_input_tokens = sum(event.cached_input_tokens for event in events)
    reasoning_tokens = sum(event.reasoning_tokens for event in events)
    output_tokens = sum(event.output_tokens for event in events)
    total_billable_tokens = sum(event.total_billable_tokens for event in events)

    cost = calculate_total_cost(
        api_calls=api_calls,
        input_tokens=input_tokens,
        cached_input_tokens=cached_input_tokens,
        reasoning_tokens=reasoning_tokens,
        output_tokens=output_tokens,
    )

    return {
        "tenant_id": tenant_id,
        "billing_period": {
            "start": month_start.isoformat(),
            "end": next_month.isoformat(),
        },
        "subscription": {
            "status": subscription.status,
            "plan": {
                "id": plan.id,
                "name": plan.name,
                "api_call_limit": plan.api_call_limit,
                "token_limit": plan.token_limit,
            },
        },
        "usage": {
            "api_calls": api_calls,
            "api_call_limit": plan.api_call_limit,
            "tokens": {
                "input_tokens": input_tokens,
                "cached_input_tokens": cached_input_tokens,
                "reasoning_tokens": reasoning_tokens,
                "output_tokens": output_tokens,
                "total_billable_tokens": total_billable_tokens,
            },
            "token_limit": plan.token_limit,
        },
        "cost": cost,
        "metering_note": (
            "Based on persisted usage events. AI assistant requests are "
            "excluded unless they are recorded as usage events."
        ),
    }


@router.get("/usage/me")
def get_my_usage(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tenant = ensure_billing_for_user(db, user)
    return build_usage_response(tenant.id, db)


@router.get("/usage/{tenant_id}")
def get_usage_for_tenant(
    tenant_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tenant = ensure_billing_for_user(db, user)
    if tenant_id != tenant.id:
        raise HTTPException(status_code=403, detail="Access to this tenant is forbidden")
    return build_usage_response(tenant.id, db)
