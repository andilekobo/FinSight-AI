from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class InvestecTransaction(Base):
    __tablename__ = "investec_transactions"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
    )

    account_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("investec_accounts.id"),
        nullable=False,
        index=True,
    )

    category_id: Mapped[str | None] = mapped_column(
        String,
        ForeignKey("categories.id"),
        nullable=True,
        index=True,
    )

    transaction_reference: Mapped[str] = mapped_column(
        String,
        nullable=False,
        unique=True,
        index=True,
    )

    description: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    transaction_type: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    amount: Mapped[float] = mapped_column(
        Numeric(15, 2),
        nullable=False,
    )

    currency: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        default="ZAR",
    )

    transaction_date: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    account = relationship("InvestecAccount")
    category = relationship("Category")