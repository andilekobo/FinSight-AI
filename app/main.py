from app.api.routes import ai_assistant
from fastapi import FastAPI

from app.api.routes import (
    accounts,
    ai_insights,
    auth,
    billing,
    financial_analytics,
    generate,
    investec,
    transactions,
    usage,
    webhooks,
)

app = FastAPI(
    title="FinSight AI API",
    description="AI-powered financial and technology spending intelligence platform",
    version="1.0.0",
)

app.include_router(auth.router)
app.include_router(generate.router)
app.include_router(usage.router)
app.include_router(webhooks.router)
app.include_router(billing.router)
app.include_router(investec.router)
app.include_router(ai_insights.router)
app.include_router(accounts.router)
app.include_router(transactions.router)
app.include_router(financial_analytics.router)

app.include_router(ai_assistant.router)
