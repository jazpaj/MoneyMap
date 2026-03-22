from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from auth import hash_password, verify_password, create_access_token, get_current_user
import models
import schemas

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=schemas.UserResponse)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.username == user_in.username).first():
        raise HTTPException(status_code=400, detail="This username is already taken. Please choose a different one.")
    if db.query(models.User).filter(models.User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists. Try signing in instead.")

    user = models.User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        currency=user_in.currency,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create default categories
    default_categories = [
        ("Salary", "briefcase", "#22C55E", "income"),
        ("Freelance", "code", "#10B981", "income"),
        ("Investments", "trending-up", "#059669", "income"),
        ("Other Income", "plus-circle", "#047857", "income"),
        ("Food & Dining", "utensils", "#EF4444", "expense"),
        ("Transportation", "car", "#F97316", "expense"),
        ("Housing", "home", "#8B5CF6", "expense"),
        ("Utilities", "zap", "#EC4899", "expense"),
        ("Entertainment", "film", "#F59E0B", "expense"),
        ("Shopping", "shopping-bag", "#6366F1", "expense"),
        ("Healthcare", "heart", "#14B8A6", "expense"),
        ("Education", "book", "#3B82F6", "expense"),
        ("Subscriptions", "repeat", "#A855F7", "expense"),
        ("Personal Care", "smile", "#D946EF", "expense"),
        ("Travel", "map", "#0EA5E9", "expense"),
        ("Gifts", "gift", "#FB923C", "expense"),
        ("Insurance", "shield", "#64748B", "expense"),
        ("Other", "more-horizontal", "#94A3B8", "expense"),
    ]
    for name, icon, color, txn_type in default_categories:
        cat = models.Category(
            user_id=user.id, name=name, icon=icon, color=color, transaction_type=txn_type
        )
        db.add(cat)

    # Create default account
    account = models.Account(
        user_id=user.id, name="Main Account", account_type="checking", balance=0.0
    )
    db.add(account)
    db.commit()

    return user


@router.post("/login", response_model=schemas.Token)
def login(login_req: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == login_req.username).first()
    if not user:
        raise HTTPException(status_code=401, detail="No account found with that username. Please check your username or create a new account.")
    if not verify_password(login_req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect password. Please try again.")
    token = create_access_token({"sub": user.id})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user
