from sqlalchemy import (
    Column, Integer, String, Float, Date, DateTime, ForeignKey, Boolean, Text, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, date
import enum


class TransactionType(str, enum.Enum):
    INCOME = "income"
    EXPENSE = "expense"
    TRANSFER = "transfer"


class RecurrenceInterval(str, enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    currency = Column(String(3), default="PHP")
    created_at = Column(DateTime, default=datetime.utcnow)

    accounts = relationship("Account", back_populates="user", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    account_type = Column(String(50), default="checking")  # checking, savings, credit, cash
    balance = Column(Float, default=0.0)
    currency = Column(String(3), default="PHP")
    color = Column(String(7), default="#4F46E5")
    icon = Column(String(50), default="wallet")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account", cascade="all, delete-orphan")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    icon = Column(String(50), default="tag")
    color = Column(String(7), default="#6366F1")
    transaction_type = Column(String(10), default="expense")
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    is_active = Column(Boolean, default=True)

    user = relationship("User", back_populates="categories")
    parent = relationship("Category", remote_side=[id], backref="subcategories")
    transactions = relationship("Transaction", back_populates="category")
    budgets = relationship("Budget", back_populates="category")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    transaction_type = Column(String(10), nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String(255))
    notes = Column(Text)
    date = Column(Date, nullable=False, default=date.today)
    is_recurring = Column(Boolean, default=False)
    recurring_id = Column(Integer, ForeignKey("recurring_transactions.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    account = relationship("Account", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
    recurring = relationship("RecurringTransaction", back_populates="generated_transactions")


class RecurringTransaction(Base):
    __tablename__ = "recurring_transactions"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    transaction_type = Column(String(10), nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String(255))
    interval = Column(String(20), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    next_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    account = relationship("Account")
    category = relationship("Category")
    generated_transactions = relationship("Transaction", back_populates="recurring")


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    name = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False)
    period = Column(String(20), default="monthly")  # monthly, weekly, yearly
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="budgets")
    category = relationship("Category", back_populates="budgets")
