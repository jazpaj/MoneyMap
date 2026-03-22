from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models
import schemas

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("/", response_model=list[schemas.CategoryResponse])
def list_categories(
    transaction_type: str = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(models.Category).filter(models.Category.user_id == current_user.id)
    if transaction_type:
        q = q.filter(models.Category.transaction_type == transaction_type)
    return q.all()


@router.post("/", response_model=schemas.CategoryResponse)
def create_category(
    data: schemas.CategoryCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cat = models.Category(user_id=current_user.id, **data.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.put("/{category_id}", response_model=schemas.CategoryResponse)
def update_category(
    category_id: int,
    data: schemas.CategoryUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cat = db.query(models.Category).filter(
        models.Category.id == category_id,
        models.Category.user_id == current_user.id,
    ).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(cat, key, val)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cat = db.query(models.Category).filter(
        models.Category.id == category_id,
        models.Category.user_id == current_user.id,
    ).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(cat)
    db.commit()
    return {"detail": "Category deleted"}
