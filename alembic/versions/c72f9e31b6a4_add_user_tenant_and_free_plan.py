from datetime import datetime

from alembic import op
import sqlalchemy as sa


revision = "c72f9e31b6a4"
down_revision = "a81c2f9e6b40"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("tenant_id", sa.String(), nullable=True),
    )
    op.create_index(
        "ix_users_tenant_id",
        "users",
        ["tenant_id"],
        unique=False,
    )

    bind = op.get_bind()
    plans = sa.table(
        "plans",
        sa.column("id", sa.String()),
        sa.column("name", sa.String()),
        sa.column("api_call_limit", sa.Integer()),
        sa.column("token_limit", sa.Integer()),
        sa.column("created_at", sa.DateTime()),
    )

    free_plan = bind.execute(
        sa.select(plans.c.id).where(
            sa.or_(
                plans.c.id == "free",
                plans.c.name == "Free",
            )
        )
    ).first()

    if free_plan is None:
        bind.execute(
            plans.insert().values(
                id="free",
                name="Free",
                api_call_limit=1000,
                token_limit=100000,
                created_at=datetime.utcnow(),
            )
        )


def downgrade() -> None:
    op.drop_index("ix_users_tenant_id", table_name="users")
    op.drop_column("users", "tenant_id")
