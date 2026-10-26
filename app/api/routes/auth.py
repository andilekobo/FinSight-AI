
import json
import urllib.error
import urllib.request
import hashlib
import hmac
import logging
import os
import secrets
import smtplib
from datetime import datetime, timedelta
from email.message import EmailMessage
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.config import JWT_SECRET_KEY
from app.db.database import get_db
from app.models.user import User
from app.models.password_reset_otp import PasswordResetOTP
from app.models.password_reset_token import PasswordResetToken
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth_service import hash_password, verify_password
from app.services.tenant_service import ensure_billing_for_user
from app.services.token_service import create_access_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

OTP_MINUTES = 10
RESET_TOKEN_MINUTES = 10
MAX_OTP_ATTEMPTS = 5
RESEND_COOLDOWN_SECONDS = 60


class PasswordEmailRequest(BaseModel):
    email: EmailStr


class VerifyResetCodeRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6, pattern=r"^[0-9]{6}$")


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=20, max_length=200)
    new_password: str = Field(min_length=8, max_length=128)


def _secret_hash(value: str) -> str:
    """Hash low-entropy codes and reset tokens with a server-side secret."""
    return hmac.new(
        JWT_SECRET_KEY.encode("utf-8"),
        value.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def _send_reset_code(email: str, code: str) -> None:
    api_key = os.getenv("RESEND_API_KEY")
    from_email = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")

    if not api_key:
        raise RuntimeError("Resend email configuration is incomplete.")

    payload = {
        "from": f"FinSight AI <{from_email}>",
        "to": [email],
        "subject": "FinSight AI - Password Reset Code",
        "text": (
            f"Your FinSight AI password reset code is: {code}\n\n"
            "This code expires in 10 minutes. "
            "If you did not request a password reset, ignore this email."
        ),
    }

    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            if response.status not in (200, 201, 202):
                raise RuntimeError(
                    f"Resend returned HTTP {response.status}."
                )
    except urllib.error.HTTPError as exc:
        logger.error("Resend rejected the email request (HTTP %s).", exc.code)
        raise RuntimeError(
            f"Resend email request failed (HTTP {exc.code})."
        ) from exc
    except urllib.error.URLError as exc:
        logger.error("Could not connect to Resend: %s", exc.reason)
        raise RuntimeError("Could not connect to the email provider.") from exc

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    request: RegisterRequest,
    db: Session = Depends(get_db),
):
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        id=str(uuid4()),
        full_name=request.full_name,
        email=str(request.email),
        password_hash=hash_password(request.password),
    )

    try:
        db.add(user)
        db.flush()
        ensure_billing_for_user(db, user)
        db.refresh(user)
        return user
    except Exception:
        db.rollback()
        raise


@router.post("/login", response_model=TokenResponse)
def login_user(
    request: LoginRequest,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == request.email).first()

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return TokenResponse(access_token=create_access_token(user.id))


@router.post("/password/forgot")
def forgot_password(
    request: PasswordEmailRequest,
    db: Session = Depends(get_db),
):
    # Check configuration before looking up the email so configuration
    # failures don't reveal whether a particular account exists.
    if not all(
        os.getenv(key)
        for key in (
            "SMTP_HOST",
            "SMTP_USERNAME",
            "SMTP_PASSWORD",
            "SMTP_FROM_EMAIL",
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Password recovery email is temporarily unavailable.",
        )

    user = db.query(User).filter(User.email == str(request.email)).first()

    # Do not disclose whether the account exists.
    if not user:
        return {"message": "If the account exists, a verification code will be sent."}

    now = datetime.utcnow()
    latest = (
        db.query(PasswordResetOTP)
        .filter(
            PasswordResetOTP.user_id == user.id,
            PasswordResetOTP.used.is_(False),
        )
        .order_by(PasswordResetOTP.created_at.desc())
        .first()
    )

    if latest and now - latest.created_at < timedelta(
        seconds=RESEND_COOLDOWN_SECONDS
    ):
        return {"message": "If the account exists, a verification code will be sent."}

    code = f"{secrets.randbelow(1_000_000):06d}"
    otp = PasswordResetOTP(
        id=str(uuid4()),
        user_id=user.id,
        otp_hash=_secret_hash(code),
        expires_at=now + timedelta(minutes=OTP_MINUTES),
        used=False,
        attempts=0,
        created_at=now,
    )

    try:
        db.add(otp)
        db.flush()
        _send_reset_code(str(user.email), code)
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Unable to send password reset email")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to send the recovery email right now. Please try again later.",
        )

    return {"message": "If the account exists, a verification code will be sent."}


@router.post("/password/verify")
def verify_password_reset_code(
    request: VerifyResetCodeRequest,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == str(request.email)).first()
    now = datetime.utcnow()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired code.")

    otp = (
        db.query(PasswordResetOTP)
        .filter(
            PasswordResetOTP.user_id == user.id,
            PasswordResetOTP.used.is_(False),
        )
        .order_by(PasswordResetOTP.created_at.desc())
        .first()
    )

    if (
        not otp
        or otp.expires_at <= now
        or otp.attempts >= MAX_OTP_ATTEMPTS
    ):
        raise HTTPException(status_code=400, detail="Invalid or expired code.")

    if not hmac.compare_digest(otp.otp_hash, _secret_hash(request.code)):
        otp.attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid or expired code.")

    otp.used = True

    reset_token = secrets.token_urlsafe(32)
    reset_record = PasswordResetToken(
        id=str(uuid4()),
        user_id=user.id,
        token_hash=_secret_hash(reset_token),
        expires_at=now + timedelta(minutes=RESET_TOKEN_MINUTES),
        used=False,
        created_at=now,
    )

    db.add(reset_record)
    db.commit()

    # Show this token once to the verified user; only its hash is stored.
    return {
        "reset_token": reset_token,
        "expires_in_seconds": RESET_TOKEN_MINUTES * 60,
    }


@router.post("/password/resend")
def resend_password_reset_code(
    request: PasswordEmailRequest,
    db: Session = Depends(get_db),
):
    # Reuse the same cooldown and generic response as the initial request.
    return forgot_password(request, db)


@router.post("/password/reset")
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    now = datetime.utcnow()
    token_hash = _secret_hash(request.token)

    record = (
        db.query(PasswordResetToken)
        .filter(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used.is_(False),
            PasswordResetToken.expires_at > now,
        )
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token.",
        )

    user = db.query(User).filter(User.id == record.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token.",
        )

    user.password_hash = hash_password(request.new_password)
    record.used = True

    # Invalidate any other outstanding reset tokens for this account.
    (
        db.query(PasswordResetToken)
        .filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used.is_(False),
        )
        .update({"used": True}, synchronize_session=False)
    )

    db.commit()
    return {"message": "Password reset successful. You can now log in."}


