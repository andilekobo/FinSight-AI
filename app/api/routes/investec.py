import os

import requests
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException

load_dotenv()

router = APIRouter(prefix="/investec", tags=["Investec Sandbox"])

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
            data={
                "grant_type": "client_credentials",
                "scope": "accounts",
            },
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


@router.get("/accounts")
def get_accounts():
    api_key = os.getenv("INVESTEC_API_KEY")
    token = get_access_token()

    try:
        response = requests.get(
            f"{BASE_URL}/za/pb/v1/accounts",
            headers={
                "Authorization": f"Bearer {token}",
                "x-api-key": api_key,
            },
            timeout=15,
        )
        response.raise_for_status()
        return {
            "source": "Investec sandbox",
            "simulated_data": True,
            "accounts": response.json(),
        }

    except requests.RequestException:
        raise HTTPException(
            status_code=502,
            detail="Could not retrieve accounts from the Investec sandbox.",
        )
