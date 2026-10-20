from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.plan import Plan
from app.models.subscription import Subscription
from app.models.tenant import Tenant
from app.models.user import User


def ensure_billing_for_user(db: Session, user: User) -> Tenant:
    try:
        tenant = db.get(Tenant, user.tenant_id) if user.tenant_id else None

        if tenant is None:
            tenant = Tenant(
                id=str(uuid4()),
                name=user.full_name,
            )
            db.add(tenant)
            db.flush()
            user.tenant_id = tenant.id

        free_plan = db.scalar(
            select(Plan).where(
                (Plan.id == "free") | (Plan.name == "Free")
            )
        )

        if free_plan is None:
            raise HTTPException(
                status_code=503,
                detail="Free billing plan is not configured.",
            )

        subscription = db.scalar(
            select(Subscription).where(
                Subscription.tenant_id == tenant.id
            )
        )

        if subscription is None:
            subscription = Subscription(
                id=str(uuid4()),
                tenant_id=tenant.id,
                plan_id=free_plan.id,
                status="active",
            )
            db.add(subscription)
        elif db.get(Plan, subscription.plan_id) is None:
            raise HTTPException(
                status_code=503,
                detail="The current subscription has no valid plan.",
            )

        db.commit()
        db.refresh(user)
        db.refresh(tenant)
        return tenant

    except Exception:
        db.rollback()
        raise
