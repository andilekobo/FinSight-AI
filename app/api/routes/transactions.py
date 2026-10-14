from datetime import datetime
from decimal import Decimal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.bank_account import BankAccount
from app.models.financial_transaction import FinancialTransaction

router = APIRouter(prefix="/transactions", tags=["Financial Transactions"])


class TransactionCreate(BaseModel):
    user_id: str = Field(min_length=1)
    account_id: str = Field(min_length=1)
    transaction_type: str
    category: str = Field(min_length=1, max_length=80)
    description: str = Field(min_length=1, max_length=250)
    amount: Decimal = Field(gt=0, max_digits=15, decimal_places=2)
    currency: str = Field(default="ZAR", min_length=3, max_length=3)
    transaction_date: datetime


class TransactionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    account_id: str
    transaction_type: str
    category: str
    description: str
    amount: Decimal
    currency: str
    transaction_date: datetime
    created_at: datetime


@router.post("/", response_model=TransactionRead, status_code=201)
def create_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
):
    if payload.transaction_type not in {"income", "expense", "fee"}:
        raise HTTPException(
            status_code=422,
            detail="transaction_type must be income, expense, or fee",
        )

    account = db.scalar(
        select(BankAccount).where(
            BankAccount.id == payload.account_id,
            BankAccount.user_id == payload.user_id,
        )
    )
    if account is None:
        raise HTTPException(status_code=404, detail="Account not found")

    if account.currency != payload.currency:
        raise HTTPException(
            status_code=422,
            detail="Transaction currency must match the account currency",
        )

    if payload.transaction_type in {"expense", "fee"}:
        if Decimal(str(account.balance)) < payload.amount:
            raise HTTPException(
                status_code=422,
                detail="Insufficient account balance",
            )
        account.balance = Decimal(str(account.balance)) - payload.amount
    else:
        account.balance = Decimal(str(account.balance)) + payload.amount

    transaction = FinancialTransaction(
        id=str(uuid4()),
        **payload.model_dump(),
    )

    try:
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
    except Exception:
        db.rollback()
        raise

    return transaction


@router.get("/", response_model=list[TransactionRead])
def list_transactions(
    user_id: str,
    account_id: str | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    statement = select(FinancialTransaction).where(
        FinancialTransaction.user_id == user_id
    )

    if account_id:
        statement = statement.where(
            FinancialTransaction.account_id == account_id
        )
    if start_date:
        statement = statement.where(
            FinancialTransaction.transaction_date >= start_date
        )
    if end_date:
        statement = statement.where(
            FinancialTransaction.transaction_date <= end_date
        )

    statement = statement.order_by(
        FinancialTransaction.transaction_date.desc()
    ).limit(limit)

    return db.scalars(statement).all()
