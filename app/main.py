from fastapi import FastAPI

from app.api.routes import auth, billing, generate, usage, webhooks

app = FastAPI(
    title="FinSight AI API",
    description="FinSight AI - Usage Metering and Billing Engine",
    version="1.0.0",
)

app.include_router(auth.router)
app.include_router(generate.router)
app.include_router(usage.router)
app.include_router(webhooks.router)
app.include_router(billing.router)
