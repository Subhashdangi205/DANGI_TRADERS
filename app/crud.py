from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session
from . import models, schemas


# 1. Get Customer by Phone
def get_customer_by_phone(db: Session, phone: str):
    return (
        db.query(models.Customer)
        .filter(models.Customer.phone == phone)
        .first()
    )


# 2. Get or Create Customer Profile
def get_or_create_customer(
    db: Session, name: str, phone: str, aadhaar_no: str = None
):
    customer = get_customer_by_phone(db, phone)
    if not customer:
        customer = models.Customer(
            name=name, phone=phone, aadhaar_no=aadhaar_no
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)
    else:
        # Optional: Update aadhaar if not previously set
        if aadhaar_no and not customer.aadhaar_no:
            customer.aadhaar_no = aadhaar_no
            db.commit()
            db.refresh(customer)
    return customer


# 3. Universal Create Transaction & Auto-Update Net Balance (Plus for Udhar, Minus for Jama)
def create_transaction(db: Session, data: schemas.TransactionCreate):
    # Get or create customer profile
    customer = get_or_create_customer(
        db,
        name=data.name,
        phone=data.phone,
        aadhaar_no=data.aadhaar_no,
    )

    # Quantity setup logic
    qty = data.quantity
    if data.category == "KHAD" and data.bags_quantity is not None:
        qty = float(data.bags_quantity)
    elif data.category == "JAMA":
        qty = 1.0

    # Auto item description for JAMA
    item_desc = data.item_name
    if data.category == "JAMA":
        item_desc = "Udhar Jama / Payment Received"

    # Create new generic transaction entry
    db_transaction = models.Transaction(
        customer_id=customer.id,
        category=data.category,  # KHAD, KHAL, KIRANA, ya JAMA
        fertilizer_type=data.fertilizer_type if data.category == "KHAD" else None,
        company_name=data.company_name if data.category == "KHAD" else None,
        item_name=item_desc,
        quantity=qty,
        rate_per_unit=data.rate_per_unit,
        total_amount=data.total_amount,
        payment_status="CASH" if data.category == "JAMA" else data.payment_status,
    )
    db.add(db_transaction)

    # Balance Adjustment Logic
    if data.category == "JAMA":
        # Customer ne paise diye -> Pending Udhar Balance MINUS (-) hoga
        customer.current_balance -= data.total_amount
    elif data.payment_status.upper() == "UDHAR":
        # Customer ne Udhar saman liya -> Pending Udhar Balance PLUS (+) hoga
        customer.current_balance += data.total_amount

    db.commit()
    db.refresh(db_transaction)
    return db_transaction, customer


# Backward Compatibility Function Alias
def create_fertilizer_token(db: Session, token_data: schemas.TokenCreate):
    return create_transaction(db, token_data)


# 4. Fetch Complete Customer Ledger Transactions (All Categories)
def get_customer_history(db: Session, customer_id: int):
    return (
        db.query(models.Transaction)
        .filter(models.Transaction.customer_id == customer_id)
        .order_by(models.Transaction.created_at.desc())
        .all()
    )


# 5. Fetch Sales & Udhar Dashboard Analytics Summary
def get_dashboard_analytics(db: Session):
    now = datetime.utcnow()

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