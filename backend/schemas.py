from pydantic import BaseModel, Field
import datetime
from typing import Optional


# --- Auth ---
class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: str
    password: str = Field(min_length=6)
    full_name: Optional[str] = None
    currency: str = "PHP"


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    currency: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    username: str
    password: str


# --- Account ---
class AccountCreate(BaseModel):
    name: str
    account_type: str = "checking"
    balance: float = 0.0
    currency: str = "PHP"
    color: str = "#4F46E5"
    icon: str = "wallet"


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    account_type: Optional[str] = None
    balance: Optional[float] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    is_active: Optional[bool] = None


class AccountResponse(BaseModel):
    id: int
    name: str
    account_type: str
    balance: float
    currency: str
    color: str
    icon: str
    is_active: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# --- Category ---
class CategoryCreate(BaseModel):
    name: str
    icon: str = "tag"
    color: str = "#6366F1"
    transaction_type: str = "expense"
    parent_id: Optional[int] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    icon: str
    color: str
    transaction_type: str
    parent_id: Optional[int]
    is_active: bool

    class Config:
        from_attributes = True


# --- Transaction ---
class TransactionCreate(BaseModel):
    account_id: int
    category_id: Optional[int] = None
    transaction_type: str
    amount: float = Field(gt=0)
    description: str = ""
    notes: Optional[str] = None
    date: datetime.date = Field(default_factory=datetime.date.today)


class TransactionUpdate(BaseModel):
    account_id: Optional[int] = None
    category_id: Optional[int] = None
    transaction_type: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    date: Optional[datetime.date] = None


class TransactionResponse(BaseModel):
    id: int
    account_id: int
    category_id: Optional[int]
    transaction_type: str
    amount: float
    description: str
    notes: Optional[str]
    date: datetime.date
    is_recurring: bool
    created_at: datetime.datetime
    category: Optional[CategoryResponse] = None
    account: Optional[AccountResponse] = None

    class Config:
        from_attributes = True


# --- Recurring ---
class RecurringCreate(BaseModel):
    account_id: int
    category_id: Optional[int] = None
    transaction_type: str
    amount: float = Field(gt=0)
    description: str = ""
    interval: str
    start_date: datetime.date
    end_date: Optional[datetime.date] = None


class RecurringResponse(BaseModel):
    id: int
    account_id: int
    category_id: Optional[int]
    transaction_type: str
    amount: float
    description: str
    interval: str
    start_date: datetime.date
    end_date: Optional[datetime.date]
    next_date: datetime.date
    is_active: bool

    class Config:
        from_attributes = True


# --- Budget ---
class BudgetCreate(BaseModel):
    category_id: Optional[int] = None
    name: str
    amount: float = Field(gt=0)
    period: str = "monthly"
    start_date: datetime.date = Field(default_factory=datetime.date.today)
    end_date: Optional[datetime.date] = None


class BudgetUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[float] = None
    category_id: Optional[int] = None
    period: Optional[str] = None
    is_active: Optional[bool] = None


class BudgetResponse(BaseModel):
    id: int
    name: str
    category_id: Optional[int]
    amount: float
    period: str
    start_date: datetime.date
    end_date: Optional[datetime.date]
    is_active: bool
    spent: float = 0.0
    remaining: float = 0.0
    percentage: float = 0.0
    category: Optional[CategoryResponse] = None

    class Config:
        from_attributes = True


# --- Analytics ---
class SpendingByCategory(BaseModel):
    category_name: str
    category_color: str
    total: float
    percentage: float
    count: int


class MonthlyTrend(BaseModel):
    month: str
    income: float
    expenses: float
    net: float


class DashboardSummary(BaseModel):
    total_balance: float
    monthly_income: float
    monthly_expenses: float
    monthly_net: float
    accounts: list[AccountResponse]
    recent_transactions: list[TransactionResponse]
    spending_by_category: list[SpendingByCategory]
    monthly_trends: list[MonthlyTrend]
    budget_alerts: list[BudgetResponse]
