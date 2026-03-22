from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models
import schemas

router = APIRouter(prefix="/api/accounts", tags=["accounts"])


@router.get("/", response_model=list[schemas.AccountResponse])
def list_accounts(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(models.Account).filter(
        models.Account.user_id == current_user.id
    ).all()


@router.post("/", response_model=schemas.AccountResponse)
def create_account(
    data: schemas.AccountCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = models.Account(user_id=current_user.id, **data.model_dump())
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.put("/{account_id}", response_model=schemas.AccountResponse)
def update_account(
    account_id: int,
    data: schemas.AccountUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = db.query(models.Account).filter(
        models.Account.id == account_id,
        models.Account.user_id == current_user.id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(account, key, val)
    db.commit()
    db.refresh(account)
    return account


@router.delete("/{account_id}")
def delete_account(
    account_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = db.query(models.Account).filter(
        models.Account.id == account_id,
        models.Account.user_id == current_user.id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    db.delete(account)
    db.commit()
    return {"detail": "Account deleted"}
