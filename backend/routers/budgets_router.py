from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from database import get_db
from auth import get_current_user
from datetime import date, timedelta
import models
import schemas

router = APIRouter(prefix="/api/budgets", tags=["budgets"])


def get_budget_period_dates(budget: models.Budget) -> tuple[date, date]:
    today = date.today()
    if budget.period == "weekly":
        start = today - timedelta(days=today.weekday())
        end = start + timedelta(days=6)
    elif budget.period == "monthly":
        start = today.replace(day=1)
        if today.month == 12:
            end = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
    elif budget.period == "yearly":
        start = today.replace(month=1, day=1)
        end = today.replace(month=12, day=31)
    else:
        start = budget.start_date
        end = budget.end_date or today
    return start, end


def enrich_budget(budget: models.Budget, db: Session, user_id: int) -> dict:
    start, end = get_budget_period_dates(budget)
    q = (
        db.query(func.coalesce(func.sum(models.Transaction.amount), 0))
        .join(models.Account)
        .filter(
            models.Account.user_id == user_id,
            models.Transaction.transaction_type == "expense",
            models.Transaction.date >= start,
            models.Transaction.date <= end,
        )
    )
    if budget.category_id:
        q = q.filter(models.Transaction.category_id == budget.category_id)

    spent = float(q.scalar())
    remaining = max(budget.amount - spent, 0)
    percentage = min((spent / budget.amount) * 100, 100) if budget.amount > 0 else 0

    return {
        **schemas.BudgetResponse.model_validate(budget).model_dump(),
        "spent": round(spent, 2),
        "remaining": round(remaining, 2),
        "percentage": round(percentage, 1),
    }


@router.get("/", response_model=list[schemas.BudgetResponse])
def list_budgets(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    budgets = (
        db.query(models.Budget)
        .options(joinedload(models.Budget.category))
        .filter(models.Budget.user_id == current_user.id, models.Budget.is_active == True)
        .all()
    )
    return [enrich_budget(b, db, current_user.id) for b in budgets]


@router.post("/", response_model=schemas.BudgetResponse)
def create_budget(
    data: schemas.BudgetCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    budget = models.Budget(user_id=current_user.id, **data.model_dump())
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return enrich_budget(budget, db, current_user.id)


@router.put("/{budget_id}", response_model=schemas.BudgetResponse)
def update_budget(
    budget_id: int,
    data: schemas.BudgetUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    budget = db.query(models.Budget).filter(
        models.Budget.id == budget_id,
        models.Budget.user_id == current_user.id,
    ).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(budget, key, val)
    db.commit()
    db.refresh(budget)
    return enrich_budget(budget, db, current_user.id)


@router.delete("/{budget_id}")
def delete_budget(
    budget_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    budget = db.query(models.Budget).filter(
        models.Budget.id == budget_id,
        models.Budget.user_id == current_user.id,
    ).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    db.delete(budget)
    db.commit()
    return {"detail": "Budget deleted"}
