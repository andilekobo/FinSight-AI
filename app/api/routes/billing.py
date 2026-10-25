from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.database import get_db
from app.models.plan import Plan
from app.models.subscription import Subscription
from app.models.user import User
from app.services.stripe_service import create_checkout_session
from app.services.tenant_service import ensure_billing_for_user

router = APIRouter(dependencies=[Depends(get_current_user)], )


class CheckoutRequest(BaseModel):
    price_id: str
    success_url: str
    cancel_url: str


@router.get("/billing/me")
def get_my_billing(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tenant = ensure_billing_for_user(db, user)
    subscription = db.scalar(
        select(Subscription).where(Subscription.tenant_id == tenant.id)
    )
    if subscription is None:
        raise HTTPException(status_code=404, detail="Subscription not found")

    plan = db.get(Plan, subscription.plan_id)
    if plan is None:
        raise HTTPException(status_code=503, detail="Subscription plan not found")

    return {
        "tenant_id": tenant.id,
        "subscription": {
            "status": subscription.status,
            "plan": {
                "id": plan.id,
                "name": plan.name,
                "api_call_limit": plan.api_call_limit,
                "token_limit": plan.token_limit,
            },
        },
        "payment_provider": "mock",
        "checkout_is_simulated": True,
        "message": "Checkout is simulated; no real payment is processed.",
    }


@router.post("/billing/checkout")
def create_checkout(
    request: CheckoutRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tenant = ensure_billing_for_user(db, user)

    try:
        session = create_checkout_session(
            tenant_id=tenant.id,
            price_id=request.price_id,
            success_url=request.success_url,
            cancel_url=request.cancel_url,
        )
        return {
            "success": True,
            "tenant_id": tenant.id,
            "checkout_session_id": session["id"],
            "checkout_url": session["url"],
            "payment_provider": "mock",
            "checkout_is_simulated": True,
        }
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="Checkout session could not be created.",
        )

