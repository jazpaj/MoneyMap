from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from datetime import date, datetime
import csv
import io
import models

router = APIRouter(prefix="/api/import-export", tags=["import-export"])


@router.post("/import-csv")
async def import_csv(
    file: UploadFile = File(...),
    account_id: int = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    content = await file.read()
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))

    # Get or use first account
    if account_id:
        account = db.query(models.Account).filter(
            models.Account.id == account_id,
            models.Account.user_id == current_user.id,
        ).first()
    else:
        account = db.query(models.Account).filter(
            models.Account.user_id == current_user.id,
        ).first()

    if not account:
        raise HTTPException(status_code=404, detail="No account found")

    # Build category lookup
    categories = db.query(models.Category).filter(
        models.Category.user_id == current_user.id
    ).all()
    cat_map = {c.name.lower(): c.id for c in categories}

    imported = 0
    errors = []

    for i, row in enumerate(reader):
        try:
            # Flexible column mapping
            amount_str = row.get("amount") or row.get("Amount") or row.get("AMOUNT", "0")
            amount = abs(float(amount_str.replace(",", "").replace("$", "")))

            desc = row.get("description") or row.get("Description") or row.get("DESCRIPTION") or row.get("memo") or row.get("Memo") or ""

            date_str = row.get("date") or row.get("Date") or row.get("DATE") or row.get("Transaction Date") or ""
            for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y", "%d/%m/%Y", "%m-%d-%Y"):
                try:
                    txn_date = datetime.strptime(date_str.strip(), fmt).date()
                    break
                except ValueError:
                    continue
            else:
                txn_date = date.today()

            # Determine type
            txn_type_str = row.get("type") or row.get("Type") or row.get("TYPE") or ""
            if txn_type_str.lower() in ("income", "credit", "deposit"):
                txn_type = "income"
            elif txn_type_str.lower() in ("expense", "debit", "withdrawal"):
                txn_type = "expense"
            elif float(amount_str.replace(",", "").replace("$", "")) < 0:
                txn_type = "expense"
            else:
                txn_type = "expense"

            # Match category
            cat_str = (row.get("category") or row.get("Category") or row.get("CATEGORY") or "").lower()
            category_id = cat_map.get(cat_str)

            txn = models.Transaction(
                account_id=account.id,
                category_id=category_id,
                transaction_type=txn_type,
                amount=amount,
                description=desc.strip(),
                date=txn_date,
            )
            db.add(txn)

            if txn_type == "income":
                account.balance += amount
            else:
                account.balance -= amount

            imported += 1
        except Exception as e:
            errors.append(f"Row {i + 1}: {str(e)}")

    db.commit()
    return {"imported": imported, "errors": errors}


@router.get("/export-csv")
def export_csv(
    start_date: date = None,
    end_date: date = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = (
        db.query(models.Transaction)
        .join(models.Account)
        .filter(models.Account.user_id == current_user.id)
    )
    if start_date:
        q = q.filter(models.Transaction.date >= start_date)
    if end_date:
        q = q.filter(models.Transaction.date <= end_date)

    transactions = q.order_by(models.Transaction.date.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Type", "Amount", "Description", "Category", "Account", "Notes"])

    for txn in transactions:
        cat_name = txn.category.name if txn.category else ""
        acct_name = txn.account.name if txn.account else ""
        writer.writerow([
            txn.date.isoformat(),
            txn.transaction_type,
            txn.amount,
            txn.description,
            cat_name,
            acct_name,
            txn.notes or "",
        ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transactions.csv"},
    )
