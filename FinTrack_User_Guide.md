# FinTrack - User Guide

## Getting Started

### Creating an Account
1. Open the app at `http://localhost:5173`
2. Click **Sign up** on the login page
3. Fill in your full name, username, email, and password (min. 6 characters)
4. Click **Create Account** — you'll be logged in automatically
5. A default **Main Account** and 18 preset categories are created for you

### Signing In
- Enter your username and password on the login page
- If the username doesn't exist, you'll see: *"No account found with that username"*
- If the password is wrong, you'll see: *"Incorrect password. Please try again."*

---

## How Tracking Works

### Transactions Are Permanent
Every transaction you add is a permanent record stored in the database. **Nothing resets at the end of the month.** The app simply filters your data by date range when displaying summaries.

### How Monthly Views Work
- The **Dashboard** automatically shows the current month's totals by filtering transactions that fall within this month
- When a new month begins, the dashboard shows that month's numbers — your previous data is still there
- Use **Monthly Report** to view any past month's data by navigating with the arrow buttons

### Account Balances Are Cumulative
- Account balances carry forward and never reset
- If your balance is PHP 10,000 at the end of March, that's your starting balance for April
- Every income transaction adds to the balance; every expense subtracts from it

### Budgets Recalculate Automatically
- Budgets track spending within their set period (weekly, monthly, or yearly)
- At the start of each new period, the "spent" amount starts fresh because the app only counts transactions within the current period's date range
- The budget itself remains active — you don't need to recreate it

---

## Features

### Dashboard
- **Summary cards** — Total balance, monthly income, expenses, and net savings
- **Monthly trends** — Area chart showing income vs expenses over the last 6 months
- **Spending breakdown** — Donut chart of expenses by category for the current month
- **Recent transactions** — Last 10 transactions with category and amount
- **Budget alerts** — Budgets that are 80% or more spent

### Transactions
- **Add transactions** — Click "Add Transaction", choose type (income/expense), amount, category, account, date, and optional notes
- **Edit/Delete** — Use the pencil and trash icons on any transaction row
- **Filter** — Search by description, filter by type, account, or date range
- Transactions are sorted by date (newest first)

### Budgets
- **Create a budget** — Set a name, amount, period (weekly/monthly/yearly), and optionally link to a specific category
- **Progress tracking** — Each budget shows a progress bar with percentage spent
  - Green = under 80%
  - Yellow = 80-99%
  - Red = 100% (over budget)
- **Category budgets** — If linked to a category, only expenses in that category count against it
- **All-expense budgets** — If no category is selected, all expenses count

### Accounts
- **Multiple accounts** — Create accounts for checking, savings, credit cards, or cash
- **Color coded** — Each account has a custom color for easy identification
- **Balance tracking** — Balances update automatically when you add, edit, or delete transactions

### Categories
- **18 default categories** — Pre-built for common income and expense types
- **Custom categories** — Create your own with a custom name and color
- **Organized by type** — Income and expense categories are grouped separately

### Recurring Transactions
- **Automate regular expenses** — Set up recurring transactions for things like rent, subscriptions, or salary
- **Intervals** — Daily, weekly, biweekly, monthly, quarterly, or yearly
- **Process due** — Click "Process Due" to generate all pending recurring transactions up to today
- Recurring transactions are marked in your transaction history

### Monthly Report
- **Navigate months** — Use arrow buttons to view any past month
- **Summary** — Income, expenses, net savings, average daily spending, with comparison to previous month
- **Daily activity chart** — Bar chart showing income and expenses per day
- **Expense breakdown** — Donut chart and itemized list by category with percentages
- **Income sources** — Same breakdown for income categories
- **Month-over-month comparison** — Side-by-side vs previous month with percentage changes
- **Top expenses** — Ranked list of largest expenses
- **Export to PDF** — Click "Export PDF" to download a formatted report

### Import / Export
- **Import CSV** — Upload a CSV file with transaction data. Supports flexible column names:
  - Date columns: `date`, `Date`, `DATE`, `Transaction Date`
  - Amount: `amount`, `Amount`, `AMOUNT`
  - Description: `description`, `Description`, `memo`, `Memo`
  - Type: `type`, `Type` (values: income/credit/deposit or expense/debit/withdrawal)
  - Category: `category`, `Category` (matched against your existing categories)
  - Supported date formats: `YYYY-MM-DD`, `MM/DD/YYYY`, `MM/DD/YY`, `DD/MM/YYYY`, `MM-DD-YYYY`
- **Export CSV** — Download all transactions as a CSV file, optionally filtered by date range

---

## Tips

1. **Add transactions daily** — The more consistent you are, the more accurate your reports will be
2. **Set up recurring transactions** — For fixed expenses like rent or subscriptions, set them up once and click "Process Due" periodically
3. **Create budgets for problem areas** — If you overspend on dining out, create a monthly budget for "Food & Dining" to track it
4. **Use multiple accounts** — Separate your checking, savings, and credit cards to see where your money actually is
5. **Export monthly reports** — Download a PDF at the end of each month for your records
6. **Import bank statements** — If your bank lets you export transactions as CSV, import them directly instead of entering manually

---

## Running the App

### Start Both Servers
```bash
cd ~/Desktop/AI\ Projects/finance-tracker
./start.sh
```

### Start Individually
**Backend (API):**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Frontend (UI):**
```bash
cd frontend
npm run dev
```

### Access Points
- **App:** http://localhost:5173
- **API Docs:** http://localhost:8000/docs

---

## Currency
All amounts are displayed in **PHP (Philippine Peso)**. This is configured in both the frontend display formatting and the backend defaults.
