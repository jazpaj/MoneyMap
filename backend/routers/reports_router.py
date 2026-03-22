from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, extract
from database import get_db
from auth import get_current_user
from datetime import date, timedelta
from calendar import monthrange
import models

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/monthly")
def monthly_report(
    year: int = Query(default=None),
    month: int = Query(default=None, ge=1, le=12),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    if not year:
        year = today.year
    if not month:
        month = today.month

    month_start = date(year, month, 1)
    _, last_day = monthrange(year, month)
    month_end = date(year, month, last_day)

    # Previous month for comparison
    if month == 1:
        prev_start = date(year - 1, 12, 1)
        _, prev_last = monthrange(year - 1, 12)
        prev_end = date(year - 1, 12, prev_last)
    else:
        prev_start = date(year, month - 1, 1)
        _, prev_last = monthrange(year, month - 1)
        prev_end = date(year, month - 1, prev_last)

    def get_period_totals(start, end):
        rows = (
            db.query(
                models.Transaction.transaction_type,
                func.coalesce(func.sum(models.Transaction.amount), 0),
                func.count(models.Transaction.id),
            )
            .join(models.Account)
            .filter(
                models.Account.user_id == current_user.id,
                models.Transaction.date >= start,
                models.Transaction.date <= end,
            )
            .group_by(models.Transaction.transaction_type)
            .all()
        )
        income = 0.0
        expenses = 0.0
        income_count = 0
        expense_count = 0
        for txn_type, total, count in rows:
            if txn_type == "income":
                income = float(total)
                income_count = count
            elif txn_type == "expense":
                expenses = float(total)
                expense_count = count
        return income, expenses, income_count, expense_count

    income, expenses, income_count, expense_count = get_period_totals(month_start, month_end)
    prev_income, prev_expenses, _, _ = get_period_totals(prev_start, prev_end)

    # Daily spending breakdown
    daily_data = (
        db.query(
            models.Transaction.date,
            models.Transaction.transaction_type,
            func.sum(models.Transaction.amount),
        )
        .join(models.Account)
        .filter(
            models.Account.user_id == current_user.id,
            models.Transaction.date >= month_start,
            models.Transaction.date <= month_end,
        )
        .group_by(models.Transaction.date, models.Transaction.transaction_type)
        .order_by(models.Transaction.date)
        .all()
    )

    daily_map = {}
    for d in range(1, last_day + 1):
        day_date = date(year, month, d)
        daily_map[day_date.isoformat()] = {"date": day_date.isoformat(), "day": d, "income": 0, "expenses": 0}

    for txn_date, txn_type, total in daily_data:
        key = txn_date.isoformat()
        if key in daily_map:
            if txn_type == "income":
                daily_map[key]["income"] = round(float(total), 2)
            elif txn_type == "expense":
                daily_map[key]["expenses"] = round(float(total), 2)

    daily_breakdown = list(daily_map.values())

    # Category breakdown
    cat_rows = (
        db.query(
            models.Category.name,
            models.Category.color,
            models.Category.icon,
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

    total_cat_spending = sum(row[3] for row in cat_rows) if cat_rows else 1
    category_breakdown = [
        {
            "name": name,
            "color": color,
            "icon": icon,
            "total": round(float(total), 2),
            "count": count,
            "percentage": round(float(total) / total_cat_spending * 100, 1),
            "avg_per_transaction": round(float(total) / count, 2) if count > 0 else 0,
        }
        for name, color, icon, total, count in cat_rows
    ]

    # Income category breakdown
    income_cat_rows = (
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
            models.Transaction.transaction_type == "income",
            models.Transaction.date >= month_start,
            models.Transaction.date <= month_end,
        )
        .group_by(models.Category.id)
        .order_by(desc(func.sum(models.Transaction.amount)))
        .all()
    )

    total_income_cat = sum(row[2] for row in income_cat_rows) if income_cat_rows else 1
    income_breakdown = [
        {
            "name": name,
            "color": color,
            "total": round(float(total), 2),
            "count": count,
            "percentage": round(float(total) / total_income_cat * 100, 1),
        }
        for name, color, total, count in income_cat_rows
    ]

    # Top transactions
    top_expenses = (
        db.query(models.Transaction)
        .join(models.Account)
        .options(joinedload(models.Transaction.category), joinedload(models.Transaction.account))
        .filter(
            models.Account.user_id == current_user.id,
            models.Transaction.transaction_type == "expense",
            models.Transaction.date >= month_start,
            models.Transaction.date <= month_end,
        )
        .order_by(desc(models.Transaction.amount))
        .limit(10)
        .all()
    )

    top_expenses_list = [
        {
            "id": t.id,
            "description": t.description or "No description",
            "amount": t.amount,
            "date": t.date.isoformat(),
            "category_name": t.category.name if t.category else "Uncategorized",
            "category_color": t.category.color if t.category else "#94A3B8",
            "account_name": t.account.name if t.account else "",
        }
        for t in top_expenses
    ]

    # Average daily spending
    days_elapsed = min((today - month_start).days + 1, last_day) if year == today.year and month == today.month else last_day
    avg_daily = round(expenses / max(days_elapsed, 1), 2)

    # Month comparison
    def calc_change(current, previous):
        if previous == 0:
            return 100 if current > 0 else 0
        return round(((current - previous) / previous) * 100, 1)

    return {
        "year": year,
        "month": month,
        "month_name": month_start.strftime("%B"),
        "days_in_month": last_day,
        "summary": {
            "total_income": round(income, 2),
            "total_expenses": round(expenses, 2),
            "net": round(income - expenses, 2),
            "income_transactions": income_count,
            "expense_transactions": expense_count,
            "total_transactions": income_count + expense_count,
            "avg_daily_spending": avg_daily,
            "highest_spending_day": max(daily_breakdown, key=lambda d: d["expenses"])["date"] if expenses > 0 else None,
            "highest_spending_amount": max(d["expenses"] for d in daily_breakdown),
        },
        "comparison": {
            "prev_month_name": prev_start.strftime("%B"),
            "prev_income": round(prev_income, 2),
            "prev_expenses": round(prev_expenses, 2),
            "prev_net": round(prev_income - prev_expenses, 2),
            "income_change": calc_change(income, prev_income),
            "expense_change": calc_change(expenses, prev_expenses),
        },
        "daily_breakdown": daily_breakdown,
        "category_breakdown": category_breakdown,
        "income_breakdown": income_breakdown,
        "top_expenses": top_expenses_list,
    }
