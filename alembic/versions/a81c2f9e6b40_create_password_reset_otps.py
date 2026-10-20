from alembic import op
import sqlalchemy as sa

revision = "a81c2f9e6b40"
down_revision = "d19b12192282"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "password_reset_otps",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("otp_hash", sa.String(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("used", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_password_reset_otps_user_id",
        "password_reset_otps",
        ["user_id"],
    )
    op.create_index(
        "ix_password_reset_otps_expires_at",
        "password_reset_otps",
        ["expires_at"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_password_reset_otps_expires_at",
        table_name="password_reset_otps",
    )
    op.drop_index(
        "ix_password_reset_otps_user_id",
        table_name="password_reset_otps",
    )
    op.drop_table("password_reset_otps")
