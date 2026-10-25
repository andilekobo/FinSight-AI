from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.database import get_db
from app.models.financial_transaction import FinancialTransaction
from app.models.user import User


router = APIRouter(dependencies=[Depends(get_current_user)], 
    prefix="/financial-analytics",
    tags=["Financial Analytics"],
)


@router.get("/summary")
def financial_summary(
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    filters = [
        FinancialTransaction.user_id == current_user.id
    ]

    if start_date:
        filters.append(
            FinancialTransaction.transaction_date >= start_date
        )

    if end_date:
        filters.append(
            FinancialTransaction.transaction_date <= end_date
        )

    rows = db.execute(
        select(
            FinancialTransaction.currency,
            FinancialTransaction.transaction_type,
            func.sum(FinancialTransaction.amount).label("total"),
            func.count(FinancialTransaction.id).label("count"),
        )
        .where(*filters)
        .group_by(
            FinancialTransaction.currency,
            FinancialTransaction.transaction_type,
        )
    ).all()

    summary = {}

    for currency, transaction_type, total, count in rows:
        if currency not in summary:
            summary[currency] = {
                "income": {
                    "total": Decimal("0"),
                    "count": 0,
                },
                "expense": {
                    "total": Decimal("0"),
                    "count": 0,
                },
                "fee": {
                    "total": Decimal("0"),
                    "count": 0,
                },
            }

        summary[currency][transaction_type] = {
            "total": total or Decimal("0"),
            "count": count or 0,
        }

    return {
        "user_id": current_user.id,
        "start_date": start_date,
        "end_date": end_date,
        "summary": summary,
    }

