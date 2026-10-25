from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.database import get_db
from app.models.financial_transaction import FinancialTransaction
from app.models.user import User


router = APIRouter(dependencies=[Depends(get_current_user)], prefix="/ai", tags=["AI Insights"])


@router.get("/insights")
def get_ai_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.utcnow()
    current_start = now - timedelta(days=30)
    previous_start = current_start - timedelta(days=30)

    current_total = db.scalar(
        select(func.coalesce(func.sum(FinancialTransaction.amount), 0))
        .where(
            FinancialTransaction.user_id == current_user.id,
            FinancialTransaction.transaction_type == "expense",
            FinancialTransaction.transaction_date >= current_start,
            FinancialTransaction.transaction_date <= now,
        )
    )

    previous_total = db.scalar(
        select(func.coalesce(func.sum(FinancialTransaction.amount), 0))
        .where(
            FinancialTransaction.user_id == current_user.id,
            FinancialTransaction.transaction_type == "expense",
            FinancialTransaction.transaction_date >= previous_start,
            FinancialTransaction.transaction_date < current_start,
        )
    )

    current_total = float(current_total or 0)
    previous_total = float(previous_total or 0)

    if previous_total > 0:
        change_percent = (
            (current_total - previous_total) / previous_total
        ) * 100
    else:
        change_percent = 0.0

    if change_percent > 10:
        message = "Your spending has increased compared with the previous 30 days."
    elif change_percent < -10:
        message = "Your spending has decreased compared with the previous 30 days."
    else:
        message = "Your spending is relatively stable compared with the previous 30 days."

    return {
        "user_id": current_user.id,
        "period_days": 30,
        "current_spending": round(current_total, 2),
        "previous_spending": round(previous_total, 2),
        "change_percent": round(change_percent, 2),
        "message": message,
    }

