from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.financial_transaction import FinancialTransaction

router = APIRouter(
    prefix="/financial-analytics",
    tags=["Financial Analytics"],
)


@router.get("/summary")
def financial_summary(
    user_id: str,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    db: Session = Depends(get_db),
):
    filters = [FinancialTransaction.user_id == user_id]

    if start_date:
        filters.append(
            FinancialTransaction.transaction_date >= start_date
        )
    if end_date:
        filters.append(
            FinancialTransaction.transaction_date <= end_date
        )

    statement = select(
        func.coalesce(
            func.sum(
                case(
                    (FinancialTransaction.transaction_type == "income",
                     FinancialTransaction.amount),
                    else_=0,
                )
            ), 0
        ).label("income"),
        func.coalesce(
            func.sum(
                case(
                    (FinancialTransaction.transaction_type == "expense",
                     FinancialTransaction.amount),
                    else_=0,
                )
            ), 0
        ).label("expenses"),
        func.coalesce(
            func.sum(
                case(
                    (FinancialTransaction.transaction_type == "fee",
                     FinancialTransaction.amount),
                    else_=0,
                )
            ), 0
        ).label("fees"),
        func.count(FinancialTransaction.id).label("transaction_count"),
    ).where(*filters)

    row = db.execute(statement).one()
    income = Decimal(str(row.income))
    expenses = Decimal(str(row.expenses))
    fees = Decimal(str(row.fees))

    return {
        "user_id": user_id,
        "total_income": str(income),
        "total_expenses": str(expenses),
        "total_fees": str(fees),
        "net_cash_flow": str(income - expenses - fees),
        "transaction_count": row.transaction_count,
        "period": {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
        },
    }
