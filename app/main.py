import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func
from sqlalchemy.orm import Session

from . import auth, crud, models, schemas, utils
from .database import Base, engine, get_db

# Load environment variables
load_dotenv()

ADMIN_USERNAME = os.getenv("APP_ADMIN_USERNAME", "subhash")
ADMIN_PASSWORD = os.getenv("APP_ADMIN_PASSWORD", "dangi_password")

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Dangi Traders Multi-Category ERP", version="2.0.0")

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Dangi Traders Multi-Category ERP API is Running!"}


# 1. Login Endpoint (Reads credentials dynamically from .env)
@app.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    username_input = form_data.username.strip()
    password_input = form_data.password.strip()

    if username_input == ADMIN_USERNAME and password_input == ADMIN_PASSWORD:
        access_token = auth.create_access_token(data={"sub": username_input})
        return {"access_token": access_token, "token_type": "bearer"}

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect Username or Password",
        headers={"WWW-Authenticate": "Bearer"},
    )


# 2. Universal Transaction Endpoint (Khad, Khal, & Kirana Support)
@app.post("/create-transaction/", response_model=schemas.TransactionResponse)
def create_transaction(
    data: schemas.TransactionCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user),
):
    transaction, customer = crud.create_transaction(db, data)
    return transaction


# Backward Compatible Route
@app.post("/generate-token/", response_model=schemas.TransactionResponse)
def create_token_legacy(
    data: schemas.TransactionCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user),
):
    transaction, customer = crud.create_transaction(db, data)
    return transaction


# 3. All Customers List Directory
@app.get("/customers")
def get_all_customers(
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user),
):
    return db.query(models.Customer).all()


# 4. Single Customer Combined Khata Ledger
@app.get("/customers/{customer_id}/history")
def get_customer_ledger(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user),
):
    customer = (
        db.query(models.Customer)
        .filter(models.Customer.id == customer_id)
        .first()
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    transactions = crud.get_customer_history(db, customer_id)
    return {"customer": customer, "transactions": transactions}


# 5. Dashboard Analytics & Udhar Summary Endpoint
@app.get("/dashboard-summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user),
):
    now = datetime.utcnow()

    # Time Filters
    today_start = datetime(now.year, now.month, now.day)
    monday_start = today_start - timedelta(days=now.weekday())
    month_start = datetime(now.year, now.month, 1)
    year_start = datetime(now.year, 1, 1)

    today_sale = (
        db.query(func.sum(models.Transaction.total_amount))
        .filter(
            models.Transaction.category != "JAMA",
            models.Transaction.created_at >= today_start,
        )
        .scalar()
        or 0.0
    )

    weekly_sale = (
        db.query(func.sum(models.Transaction.total_amount))
        .filter(
            models.Transaction.category != "JAMA",
            models.Transaction.created_at >= monday_start,
        )
        .scalar()
        or 0.0
    )

    monthly_sale = (
        db.query(func.sum(models.Transaction.total_amount))
        .filter(
            models.Transaction.category != "JAMA",
            models.Transaction.created_at >= month_start,
        )
        .scalar()
        or 0.0
    )

    yearly_sale = (
        db.query(func.sum(models.Transaction.total_amount))
        .filter(
            models.Transaction.category != "JAMA",
            models.Transaction.created_at >= year_start,
        )
        .scalar()
        or 0.0
    )

    total_udhar_given = (
        db.query(func.sum(models.Transaction.total_amount))
        .filter(
            models.Transaction.payment_status == "UDHAR",
            models.Transaction.category != "JAMA",
        )
        .scalar()
        or 0.0
    )

    total_jama_received = (
        db.query(func.sum(models.Transaction.total_amount))
        .filter(models.Transaction.category == "JAMA")
        .scalar()
        or 0.0
    )

    net_pending_udhar = (
        db.query(func.sum(models.Customer.current_balance)).scalar() or 0.0
    )

    return {
        "sales": {
            "today": today_sale,
            "weekly": weekly_sale,
            "monthly": monthly_sale,
            "yearly": yearly_sale,
        },
        "udhar_summary": {
            "total_udhar_given": total_udhar_given,
            "total_jama_received": total_jama_received,
            "net_pending_udhar": net_pending_udhar,
        },
    }


# 6. Combined Customer Excel Download
@app.get("/download-excel/{customer_id}")
def download_excel(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user),
):
    customer = (
        db.query(models.Customer)
        .filter(
            (models.Customer.phone == customer_id)
            | (models.Customer.name.ilike(f"%{customer_id}%"))
        )
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404, detail="No customer found with those details."
        )

    transactions = crud.get_customer_history(db, customer.id)
    excel_stream = utils.generate_customer_excel(customer, transactions)

    filename = f"Khata_{customer.name.replace(' ', '_')}.xlsx"

    return StreamingResponse(
        excel_stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )