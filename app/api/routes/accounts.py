from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.database import get_db
from app.models.bank_account import BankAccount
from app.models.user import User


router = APIRouter(dependencies=[Depends(get_current_user)], prefix="/accounts", tags=["Financial Accounts"])


class AccountCreate(BaseModel):
    account_name: str = Field(min_length=1, max_length=150)
    account_type: str = Field(min_length=1, max_length=50)
    currency: str = Field(default="ZAR", min_length=3, max_length=3)
    balance: float = Field(default=0, ge=0)


class AccountRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    account_name: str
    account_type: str
    currency: str
    balance: float


@router.post("/", response_model=AccountRead, status_code=201)
def create_account(
    payload: AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = BankAccount(
        id=str(uuid4()),
        user_id=current_user.id,
        account_name=payload.account_name,
        account_type=payload.account_type,
        currency=payload.currency.upper(),
        balance=payload.balance,
    )

    db.add(account)
    db.commit()
    db.refresh(account)

    return account


@router.get("/", response_model=list[AccountRead])
def list_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = (
        select(BankAccount)
        .where(BankAccount.user_id == current_user.id)
        .order_by(BankAccount.created_at.desc())
    )

    return db.scalars(statement).all()


@router.get("/{account_id}", response_model=AccountRead)
def get_account(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = db.scalar(
        select(BankAccount).where(
            BankAccount.id == account_id,
            BankAccount.user_id == current_user.id,
        )
    )

    if account is None:
        raise HTTPException(
            status_code=404,
            detail="Account not found",
        )

    return account

