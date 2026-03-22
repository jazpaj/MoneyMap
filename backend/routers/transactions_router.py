from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from database import get_db
from auth import get_current_user
from datetime import date, timedelta
import models
import schemas

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.get("/", response_model=list[schemas.TransactionResponse])
def list_transactions(
    account_id: int = None,
    category_id: int = None,
    transaction_type: str = None,
    start_date: date = None,
    end_date: date = None,
    search: str = None,
    limit: int = Query(default=50, le=500),
    offset: int = 0,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = (
        db.query(models.Transaction)
        .join(models.Account)
        .options(joinedload(models.Transaction.category), joinedload(models.Transaction.account))
        .filter(models.Account.user_id == current_user.id)
    )
    if account_id:
        q = q.filter(models.Transaction.account_id == account_id)
    if category_id:
        q = q.filter(models.Transaction.category_id == category_id)
    if transaction_type:
        q = q.filter(models.Transaction.transaction_type == transaction_type)
    if start_date:
        q = q.filter(models.Transaction.date >= start_date)
    if end_date:
        q = q.filter(models.Transaction.date <= end_date)
    if search:
        q = q.filter(models.Transaction.description.ilike(f"%{search}%"))

    return q.order_by(desc(models.Transaction.date), desc(models.Transaction.id)).offset(offset).limit(limit).all()


@router.post("/", response_model=schemas.TransactionResponse)
def create_transaction(
    data: schemas.TransactionCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = db.query(models.Account).filter(
        models.Account.id == data.account_id,
        models.Account.user_id == current_user.id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    txn = models.Transaction(**data.model_dump())
    db.add(txn)

    if data.transaction_type == "income":
        account.balance += data.amount
    elif data.transaction_type == "expense":
        account.balance -= data.amount

    db.commit()
    db.refresh(txn)

    txn = (
        db.query(models.Transaction)
        .options(joinedload(models.Transaction.category), joinedload(models.Transaction.account))
        .filter(models.Transaction.id == txn.id)
        .first()
    )
    return txn


@router.put("/{txn_id}", response_model=schemas.TransactionResponse)
def update_transaction(
    txn_id: int,
    data: schemas.TransactionUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    txn = (
        db.query(models.Transaction)
        .join(models.Account)
        .filter(models.Transaction.id == txn_id, models.Account.user_id == current_user.id)
        .first()
    )
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    account = db.query(models.Account).get(txn.account_id)
    old_amount = txn.amount
    old_type = txn.transaction_type

    # Reverse old effect
    if old_type == "income":
        account.balance -= old_amount
    elif old_type == "expense":
        account.balance += old_amount

    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(txn, key, val)

    # Apply new effect
    if txn.transaction_type == "income":
        account.balance += txn.amount
    elif txn.transaction_type == "expense":
        account.balance -= txn.amount

    db.commit()
    db.refresh(txn)

    txn = (
        db.query(models.Transaction)
        .options(joinedload(models.Transaction.category), joinedload(models.Transaction.account))
        .filter(models.Transaction.id == txn.id)
        .first()
    )
    return txn


@router.delete("/{txn_id}")
def delete_transaction(
    txn_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    txn = (
        db.query(models.Transaction)
        .join(models.Account)
        .filter(models.Transaction.id == txn_id, models.Account.user_id == current_user.id)
        .first()
    )
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    account = db.query(models.Account).get(txn.account_id)
    if txn.transaction_type == "income":
        account.balance -= txn.amount
    elif txn.transaction_type == "expense":
        account.balance += txn.amount

    db.delete(txn)
    db.commit()
    return {"detail": "Transaction deleted"}
