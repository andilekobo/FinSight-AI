from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class FinancialTransaction(Base):
    __tablename__ = "financial_transactions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False, index=True
    )
    account_id: Mapped[str] = mapped_column(
        String, ForeignKey("bank_accounts.id"), nullable=False, index=True
    )
    transaction_type: Mapped[str] = mapped_column(String(20), nullable=False)
    category: Mapped[str] = mapped_column(String(80), nullable=False)
    description: Mapped[str] = mapped_column(String(250), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="ZAR")
    transaction_date: Mapped[datetime] = mapped_column(
        DateTime, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
