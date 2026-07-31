from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from .database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    phone = Column(String, unique=True, index=True, nullable=False)
    aadhaar_no = Column(String, nullable=True)
    current_balance = Column(Float, default=0.0)  # Total Net Pending Udhar (Khad + Khal + Kirana)

    transactions = relationship("Transaction", back_populates="customer")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    
    # Category Tag: 'KHAD', 'KHAL', ya 'KIRANA'
    category = Column(String, nullable=False, default="KHAD")
    
    # Khad specific fields (Nullable for Khal/Kirana)
    fertilizer_type = Column(String, nullable=True)  # Urea, DAP, etc.
    company_name = Column(String, nullable=True)     # IFFCO, Chambal, etc.
    
    # Common Item/Description Field (Khal ya Kirana ke items ke liye)
    item_name = Column(String, nullable=True)        # e.g., "Kapas Khal", "Churi", "Sugar 5kg"
    
    quantity = Column(Float, nullable=False, default=1.0) # Bags for Khad/Khal, Qty for Kirana
    rate_per_unit = Column(Float, nullable=True)          # Per Bag or Per Item Rate
    total_amount = Column(Float, default=0.0)
    payment_status = Column(String, default="CASH")       # CASH ya UDHAR
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="transactions")