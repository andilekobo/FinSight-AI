import pytest
from sqlalchemy import inspect

from app.db.database import Base
import app.models

from app.models import (
    AIInsight,
    Category,
    InvestecAccount,
    InvestecTransaction,
    Plan,
    StripeEvent,
    Subscription,
    Tenant,
    UsageEvent,
    User,
)

EXPECTED_TABLES = {
    "ai_insights",
    "categories",
    "investec_accounts",
    "investec_transactions",
    "plans",
    "stripe_events",
    "subscriptions",
    "tenants",
    "usage_events",
    "users",
}


def test_expected_models_are_registered():
    assert EXPECTED_TABLES.issubset(Base.metadata.tables.keys())


@pytest.mark.parametrize(
    "model",
    [
        AIInsight, Category, InvestecAccount, InvestecTransaction,
        Plan, StripeEvent, Subscription, Tenant, UsageEvent, User,
    ],
)
def test_model_has_primary_key(model):
    assert len(inspect(model).primary_key) >= 1


@pytest.mark.parametrize(
    "model, columns",
    [
        (User, {"id", "email", "full_name", "password_hash"}),
        (Plan, {"id", "name", "api_call_limit", "token_limit"}),
        (Tenant, {"id", "name"}),
        (Subscription, {"id", "tenant_id", "plan_id", "status"}),
        (UsageEvent, {"id", "tenant_id", "idempotency_key", "total_billable_tokens"}),
        (InvestecAccount, {"id", "user_id", "account_name", "account_number"}),
        (InvestecTransaction, {"id", "account_id", "transaction_reference", "amount"}),
        (Category, {"id", "name", "category_type"}),
        (AIInsight, {"id", "user_id", "title", "description"}),
        (StripeEvent, {"id", "stripe_event_id", "event_type"}),
    ],
)
def test_model_has_expected_columns(model, columns):
    actual = set(model.__table__.columns.keys())
    assert columns.issubset(actual)


def test_transaction_relationships():
    relationships = inspect(InvestecTransaction).relationships
    assert "account" in relationships
    assert "category" in relationships


def test_ai_insight_user_relationship():
    assert "user" in inspect(AIInsight).relationships


def test_investec_account_user_relationship():
    assert "user" in inspect(InvestecAccount).relationships
