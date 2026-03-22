from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, extract
from database import get_db
from auth import get_current_user
from datetime import date, timedelta
import models
import schemas
from routers.budgets_router import enrich_budget

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/dashboard", response_model=schemas.DashboardSummary)
def get_dashboard(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    month_start = today.replace(day=1)
    if today.month == 12:
        month_end = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
    else:
        month_end = today.replace(month=today.month + 1, day=1) - timedelta(days=1)

    # Accounts
    accounts = db.query(models.Account).filter(
        models.Account.user_id == current_user.id,
        models.Account.is_active == True,
    ).all()
    total_balance = sum(a.balance for a in accounts)

    # Monthly income/expenses
    monthly_totals = (
        db.query(
            models.Transaction.transaction_type,
            func.sum(models.Transaction.amount),
        )
        .join(models.Account)
        .filter(
            models.Account.user_id == current_user.id,
            models.Transaction.date >= month_start,
            models.Transaction.date <= month_end,
        )
        .group_by(models.Transaction.transaction_type)
        .all()
    )
    monthly_income = 0.0
    monthly_expenses = 0.0
    for txn_type, total in monthly_totals:
        if txn_type == "income":
            monthly_income = float(total)
        elif txn_type == "expense":
            monthly_expenses = float(total)

    # Recent transactions
    recent = (
        db.query(models.Transaction)
        .join(models.Account)
        .options(joinedload(models.Transaction.category), joinedload(models.Transaction.account))
        .filter(models.Account.user_id == current_user.id)
        .order_by(desc(models.Transaction.date), desc(models.Transaction.id))
        .limit(10)
        .all()
    )

    # Spending by category (current month)
    cat_spending = (
        db.query(
            models.Category.name,
            models.Category.color,
            func.sum(models.Transaction.amount),
            func.count(models.Transaction.id),
        )
        .join(models.Transaction, models.Transaction.category_id == models.Category.id)
        .join(models.Account, models.Transaction.account_id == models.Account.id)
        .filter(
            models.Account.user_id == current_user.id,
            models.Transaction.transaction_type == "expense",
            models.Transaction.date >= month_start,
            models.Transaction.date <= month_end,
        )
        .group_by(models.Category.id)
        .order_by(desc(func.sum(models.Transaction.amount)))
        .all()
    )
    total_cat_spending = sum(row[2] for row in cat_spending) if cat_spending else 1
    spending_by_category = [
        schemas.SpendingByCategory(
            category_name=name,
            category_color=color,
            total=round(float(total), 2),
            percentage=round(float(total) / total_cat_spending * 100, 1),
            count=count,
        )
        for name, color, total, count in cat_spending
    ]

    # Monthly trends (last 6 months)
    trends = []
    for i in range(5, -1, -1):
        m_date = today - timedelta(days=30 * i)
        m_start = m_date.replace(day=1)
        if m_date.month == 12:
            m_end = m_date.replace(year=m_date.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            m_end = m_date.replace(month=m_date.month + 1, day=1) - timedelta(days=1)

        m_totals = (
            db.query(
                models.Transaction.transaction_type,
                func.coalesce(func.sum(models.Transaction.amount), 0),
            )
            .join(models.Account)
            .filter(
                models.Account.user_id == current_user.id,
                models.Transaction.date >= m_start,
                models.Transaction.date <= m_end,
            )
            .group_by(models.Transaction.transaction_type)
            .all()
        )
        m_income = 0.0
        m_expense = 0.0
        for t, s in m_totals:
            if t == "income":
                m_income = float(s)
            elif t == "expense":
                m_expense = float(s)

        trends.append(schemas.MonthlyTrend(
            month=m_start.strftime("%b %Y"),
            income=round(m_income, 2),
            expenses=round(m_expense, 2),
            net=round(m_income - m_expense, 2),
        ))

    # Budget alerts (over 80%)
    budgets = (
        db.query(models.Budget)
        .options(joinedload(models.Budget.category))
        .filter(models.Budget.user_id == current_user.id, models.Budget.is_active == True)
        .all()
    )
    budget_alerts = []
    for b in budgets:
        enriched = enrich_budget(b, db, current_user.id)
        if enriched["percentage"] >= 80:
            budget_alerts.append(enriched)

    return schemas.DashboardSummary(
        total_balance=round(total_balance, 2),
        monthly_income=round(monthly_income, 2),
        monthly_expenses=round(monthly_expenses, 2),
        monthly_net=round(monthly_income - monthly_expenses, 2),
        accounts=accounts,
        recent_transactions=recent,
        spending_by_category=spending_by_category,
        monthly_trends=trends,
        budget_alerts=budget_alerts,
    )


@router.get("/spending-by-category", response_model=list[schemas.SpendingByCategory])
def spending_by_category(
    start_date: date = None,
    end_date: date = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    if not start_date:
        start_date = today.replace(day=1)
    if not end_date:
        end_date = today

    cat_spending = (
        db.query(
            models.Category.name,
            models.Category.color,
            func.sum(models.Transaction.amount),
            func.count(models.Transaction.id),
        )
        .join(models.Transaction, models.Transaction.category_id == models.Category.id)
        .join(models.Account, models.Transaction.account_id == models.Account.id)
        .filter(
            models.Account.user_id == current_user.id,
            models.Transaction.transaction_type == "expense",
            models.Transaction.date >= start_date,
            models.Transaction.date <= end_date,
        )
        .group_by(models.Category.id)
        .order_by(desc(func.sum(models.Transaction.amount)))
        .all()
    )
    total = sum(row[2] for row in cat_spending) if cat_spending else 1
    return [
        schemas.SpendingByCategory(
            category_name=name,
            category_color=color,
            total=round(float(t), 2),
            percentage=round(float(t) / total * 100, 1),
            count=count,
        )
        for name, color, t, count in cat_spending
    ]
