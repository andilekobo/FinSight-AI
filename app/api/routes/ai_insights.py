from uuid import uuid4

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.ai_insight import AIInsight
from app.models.user import User
from app.services.token_service import decode_access_token

router = APIRouter(prefix="/ai/insights", tags=["AI Insights"])


class SpendingAnalysisRequest(BaseModel):
    total_spending: float = Field(ge=0)
    previous_spending: float = Field(ge=0)
    currency: str = Field(default="ZAR", min_length=3, max_length=3)


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    """Authenticate a user using a Bearer JWT."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    scheme, _, token = authorization.partition(" ")

    if scheme.lower() != "bearer" or not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Use Authorization: Bearer <token>",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = decode_access_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


@router.post("", status_code=status.HTTP_201_CREATED)
def create_insight(
    request: SpendingAnalysisRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Create and save a spending insight."""
    difference = request.total_spending - request.previous_spending

    if request.previous_spending == 0:
        percentage_change = None
    else:
        percentage_change = (
            difference / request.previous_spending
        ) * 100

    if difference > 0:
        title = "Spending increased"
        insight_type = "spending_increase"
        severity = "warning"
        description = (
            f"Spending is {request.currency} "
            f"{difference:,.2f} higher than the previous period."
        )
        if percentage_change is not None:
            description += (
                f" This is an increase of "
                f"{percentage_change:.2f}%."
            )
        description += (
            " Review the largest expense categories to identify "
            "the reasons for the increase."
        )
    elif difference < 0:
        title = "Spending decreased"
        insight_type = "spending_decrease"
        severity = "info"
        description = (
            f"Spending is {request.currency} "
            f"{abs(difference):,.2f} lower than the previous period."
        )
        if percentage_change is not None:
            description += (
                f" This is a decrease of "
                f"{abs(percentage_change):.2f}%."
            )
        description += (
            " Review which expenses decreased to understand "
            "whether the reduction is sustainable."
        )
    else:
        title = "Spending remained unchanged"
        insight_type = "spending_unchanged"
        severity = "info"
        description = (
            "Spending is unchanged compared with the previous period. "
            "Review individual expenses for further opportunities."
        )

    insight = AIInsight(
        id=str(uuid4()),
        user_id=user.id,
        insight_type=insight_type,
        title=title,
        description=description,
        severity=severity,
    )

    try:
        db.add(insight)
        db.commit()
        db.refresh(insight)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save the insight.",
        )

    return {
        "id": insight.id,
        "title": insight.title,
        "insight_type": insight.insight_type,
        "description": insight.description,
        "severity": insight.severity,
        "created_at": insight.created_at,
        "generated_by": "rules",
    }


@router.get("")
def list_insights(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List only the authenticated user's saved insights."""
    insights = (
        db.query(AIInsight)
        .filter(AIInsight.user_id == user.id)
        .order_by(AIInsight.created_at.desc())
        .all()
    )

    return {
        "count": len(insights),
        "insights": [
            {
                "id": insight.id,
                "title": insight.title,
                "insight_type": insight.insight_type,
                "description": insight.description,
                "severity": insight.severity,
                "created_at": insight.created_at,
            }
            for insight in insights
        ],
    }
