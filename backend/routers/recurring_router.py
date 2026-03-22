from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta
import models
import schemas

router = APIRouter(prefix="/api/recurring", tags=["recurring"])


def calculate_next_date(current_date: date, interval: str) -> date:
    if interval == "daily":
        return current_date + timedelta(days=1)
    elif interval == "weekly":
        return current_date + timedelta(weeks=1)
    elif interval == "biweekly":
        return current_date + timedelta(weeks=2)
    elif interval == "monthly":
        return current_date + relativedelta(months=1)
    elif interval == "quarterly":
        return current_date + relativedelta(months=3)
    elif interval == "yearly":
        return current_date + relativedelta(years=1)
    return current_date + relativedelta(months=1)


@router.get("/", response_model=list[schemas.RecurringResponse])
def list_recurring(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.RecurringTransaction)
        .join(models.Account)
        .filter(models.Account.user_id == current_user.id)
        .all()
    )


@router.post("/", response_model=schemas.RecurringResponse)
def create_recurring(
    data: schemas.RecurringCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = db.query(models.Account).filter(
        models.Account.id == data.account_id,
        models.Account.user_id == current_user.id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    rec = models.RecurringTransaction(
        **data.model_dump(),
        next_date=data.start_date,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec


@router.post("/process")
def process_recurring(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    recurring = (
        db.query(models.RecurringTransaction)
        .join(models.Account)
        .filter(
            models.Account.user_id == current_user.id,
            models.RecurringTransaction.is_active == True,
            models.RecurringTransaction.next_date <= today,
        )
        .all()
    )

    created = 0
    for rec in recurring:
        if rec.end_date and rec.next_date > rec.end_date:
            rec.is_active = False
            continue

        account = db.query(models.Account).get(rec.account_id)
        txn = models.Transaction(
            account_id=rec.account_id,
            category_id=rec.category_id,
            transaction_type=rec.transaction_type,
            amount=rec.amount,
            description=rec.description,
            date=rec.next_date,
            is_recurring=True,
            recurring_id=rec.id,
        )
        db.add(txn)

        if rec.transaction_type == "income":
            account.balance += rec.amount
        elif rec.transaction_type == "expense":
            account.balance -= rec.amount

        rec.next_date = calculate_next_date(rec.next_date, rec.interval)
        created += 1

    db.commit()
    return {"detail": f"Processed {created} recurring transactions"}


@router.delete("/{rec_id}")
def delete_recurring(
    rec_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rec = (
        db.query(models.RecurringTransaction)
        .join(models.Account)
        .filter(
            models.RecurringTransaction.id == rec_id,
            models.Account.user_id == current_user.id,
        )
        .first()
    )
    if not rec:
        raise HTTPException(status_code=404, detail="Recurring transaction not found")
    db.delete(rec)
    db.commit()
    return {"detail": "Recurring transaction deleted"}
