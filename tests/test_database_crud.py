from datetime import datetime
from uuid import uuid4

from sqlalchemy import select

from app.db.database import SessionLocal
from app.models import (
    User,
    InvestecAccount,
    InvestecTransaction,
    Category,
)


def test_financial_models_crud_and_relationships():
    db = SessionLocal()
    transaction = db.begin()

    suffix = uuid4().hex
    user_id = f"test-user-{suffix}"
    account_id = f"test-account-{suffix}"
    category_id = f"test-category-{suffix}"
    transaction_id = f"test-tx-{suffix}"
    email = f"crud-{suffix}@example.invalid"
    reference = f"test-ref-{suffix}"

    try:
        user = User(
            id=user_id,
            email=email,
            full_name="CRUD Test User",
            password_hash="not-a-real-password-hash",
        )
        db.add(user)
        db.flush()

        account = InvestecAccount(
            id=account_id,
            user_id=user_id,
            account_name="Test Account",
            account_number=f"TEST{suffix[:12]}",
            account_type="current",
            currency="ZAR",
            balance=1000,
            status="active",
        )
        category = Category(
            id=category_id,
            user_id=user_id,
            name="CRUD Test",
            category_type="expense",
            is_default=False,
        )
        db.add_all([account, category])
        db.flush()

        tx = InvestecTransaction(
            id=transaction_id,
            account_id=account_id,
            category_id=category_id,
            transaction_reference=reference,
            description="CRUD integration test",
            transaction_type="debit",
            amount=125.50,
            currency="ZAR",
            transaction_date=datetime(2026, 1, 1),
        )
        db.add(tx)
        db.flush()

        # Read records and verify foreign-key relationships.
        saved_user = db.get(User, user_id)
        saved_account = db.get(InvestecAccount, account_id)
        saved_tx = db.get(InvestecTransaction, transaction_id)

        assert saved_user is not None
        assert saved_user.email == email
        assert saved_account is not None
        assert saved_account.user_id == saved_user.id
        assert saved_tx is not None
        assert saved_tx.account_id == saved_account.id
        assert saved_tx.category_id == category_id
        assert saved_tx.account.id == account_id
        assert saved_tx.category.id == category_id

        # Update and verify the change.
        saved_account.balance = 875.50
        db.flush()
        db.expire(saved_account)
        assert float(db.get(InvestecAccount, account_id).balance) == 875.50

        # Delete a test transaction and verify the deletion within this transaction.
        db.delete(saved_tx)
        db.flush()
        assert db.get(InvestecTransaction, transaction_id) is None

    finally:
        # Undo every test write, even if an assertion fails.
        transaction.rollback()
        db.close()
