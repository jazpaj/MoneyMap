from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
import os
from routers import (
    auth_router,
    accounts_router,
    categories_router,
    transactions_router,
    budgets_router,
    recurring_router,
    analytics_router,
    import_export_router,
    reports_router,
)

app = FastAPI(title="Finance Tracker API", version="1.0.0")

# Allow frontend origins (local + production Vercel URL)
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]
frontend_url = os.environ.get("FRONTEND_URL", "")
if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(accounts_router.router)
app.include_router(categories_router.router)
app.include_router(transactions_router.router)
app.include_router(budgets_router.router)
app.include_router(recurring_router.router)
app.include_router(analytics_router.router)
app.include_router(import_export_router.router)
app.include_router(reports_router.router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/api/health")
def health():
    return {"status": "ok"}
