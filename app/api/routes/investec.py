import os
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from uuid import NAMESPACE_URL, uuid5

import requests
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.routes.ai_insights import get_current_user
from app.db.database import get_db
from app.models.bank_account import BankAccount
from app.models.financial_transaction import FinancialTransaction
from app.models.user import User

load_dotenv()

from app.api.dependencies import get_current_user
router = APIRouter(dependencies=[Depends(get_current_user)], prefix="/investec", tags=["Investec Sandbox"])

BASE_URL = os.getenv(
    "INVESTEC_BASE_URL",
    "https://openapisandbox.investec.com",
).rstrip("/")


def get_access_token() -> str:
    client_id = os.getenv("INVESTEC_CLIENT_ID")
    client_secret = os.getenv("INVESTEC_CLIENT_SECRET")
    api_key = os.getenv("INVESTEC_API_KEY")

    if not client_id or not client_secret or not api_key:
        raise HTTPException(
            status_code=503,
            detail="Investec sandbox credentials are not configured.",
        )

    try:
        response = requests.post(
            f"{BASE_URL}/identity/v2/oauth2/token",
            auth=(client_id, client_secret),
            headers={"x-api-key": api_key},
            data={"grant_type": "client_credentials", "scope": "accounts"},
            timeout=15,
        )
        response.raise_for_status()
        token = response.json().get("access_token")

        if not token:
            raise HTTPException(
                status_code=502,
                detail="Investec did not return an access token.",
            )

        return token
    except requests.RequestException:
        raise HTTPException(
            status_code=502,
            detail="Could not authenticate with the Investec sandbox.",
        )


def investec_headers(token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "x-api-key": os.getenv("INVESTEC_API_KEY", ""),
    }


def fetch_accounts(token: str) -> list[dict]:
    try:
        response = requests.get(
            f"{BASE_URL}/za/pb/v1/accounts",
            headers=investec_headers(token),
            timeout=20,
        )
        response.raise_for_status()
        payload = response.json()
        return payload.get("data", {}).get("accounts", [])
    except requests.RequestException:
        raise HTTPException(
            status_code=502,
            detail="Could not retrieve accounts from the Investec sandbox.",
        )


@router.get("/accounts")
def get_accounts():
    token = get_access_token()
    return {
        "source": "Investec sandbox",
        "simulated_data": True,
        "accounts": fetch_accounts(token),
    }


@router.post("/sync")
def sync_transactions(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Import sandbox accounts and transactions without duplicate records."""
    token = get_access_token()
    accounts = fetch_accounts(token)

    if not accounts:
        return {
            "source": "Investec sandbox",
            "simulated_data": True,
            "accounts_synced": 0,
            "transactions_imported": 0,
            "transactions_skipped": 0,
            "message": "The sandbox returned no accounts.",
        }

    accounts_synced = 0
    transactions_imported = 0
    transactions_skipped = 0

    try:
        for source_account in accounts:
            external_account_id = source_account.get("accountId")
            if not external_account_id:
                continue

            account_id = str(
                uuid5(
                    NAMESPACE_URL,
                    f"finsight-investec-account:{user.id}:{external_account_id}",
                )
            )

            account = db.get(BankAccount, account_id)

            if account is None:
                account = BankAccount(
                    id=account_id,
                    user_id=user.id,
                    account_name=(
                        source_account.get("referenceName")
                        or source_account.get("accountName")
                        or "Investec Sandbox Account"
                    ) + " (Sandbox)",
                    account_type=(
                        source_account.get("productName") or "Investec Account"
                    ),
                    currency="ZAR",
                    balance=Decimal("0.00"),
                )
                db.add(account)
                db.flush()
            else:
                account.account_name = (
                    source_account.get("referenceName")
                    or source_account.get("accountName")
                    or "Investec Sandbox Account"
                ) + " (Sandbox)"
                account.account_type = (
                    source_account.get("productName") or "Investec Account"
                )

            accounts_synced += 1

            try:
                response = requests.get(
                    f"{BASE_URL}/za/pb/v1/accounts/"
                    f"{external_account_id}/transactions",
                    headers=investec_headers(token),
                    timeout=20,
                )
                response.raise_for_status()
                transaction_payload = response.json()
            except requests.RequestException:
                raise HTTPException(
                    status_code=502,
                    detail=(
                        "Could not retrieve transactions for an Investec "
                        "sandbox account. The sync was rolled back."
                    ),
                )

            source_transactions = (
                transaction_payload.get("data", {}).get("transactions", [])
            )

            for transaction_index, source_tx in enumerate(source_transactions):
                external_tx_id = source_tx.get("uuid") or "no-external-id"
                identity = (
                    f"finsight-investec-transaction:{user.id}:"
                    f"{external_account_id}:{external_tx_id}:"
                    f"{transaction_index}:{source_tx.get('transactionDate')}:"
                    f"{source_tx.get('type')}:{source_tx.get('amount')}:"
                    f"{source_tx.get('description')}"
                )
                tx_id = str(uuid5(NAMESPACE_URL, identity))

                if db.get(FinancialTransaction, tx_id) is not None:
                    transactions_skipped += 1
                    continue

                raw_type = str(source_tx.get("type", "")).upper()
                if raw_type == "CREDIT":
                    transaction_type = "income"
                elif raw_type == "DEBIT":
                    transaction_type = "expense"
                else:
                    transactions_skipped += 1
                    continue

                try:
                    amount = Decimal(str(source_tx.get("amount")))
                    tx_date = date.fromisoformat(
                        source_tx["transactionDate"]
                    )
                except (InvalidOperation, TypeError, ValueError, KeyError):
                    transactions_skipped += 1
                    continue

                if not amount.is_finite() or amount < 0:
                    transactions_skipped += 1
                    continue

                description = str(
                    source_tx.get("description") or "Investec transaction"
                )[:210]

                category = str(
                    source_tx.get("transactionType") or "Uncategorised"
                )[:80]

                db.add(
                    FinancialTransaction(
                        id=tx_id,
                        user_id=user.id,
                        account_id=account_id,
                        transaction_type=transaction_type,
                        category=category,
                        description=f"[Investec Sandbox] {description}"[:250],
                        amount=amount,
                        currency="ZAR",
                        transaction_date=datetime.combine(tx_date, datetime.min.time()),
                    )
                )
                transactions_imported += 1

        # Historical transactions must not be replayed against account balances.
        db.commit()

    except Exception:
        db.rollback()
        raise

    return {
        "source": "Investec sandbox",
        "simulated_data": True,
        "accounts_synced": accounts_synced,
        "transactions_imported": transactions_imported,
        "transactions_skipped": transactions_skipped,
        "message": (
            "Sandbox transactions are now available to FinSight AI. "
            "Account balances are not recalculated from historical records."
        ),
    }

