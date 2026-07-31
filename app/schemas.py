from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# --- Customer Base & Response Schemas ---
class CustomerBase(BaseModel):
    name: str
    phone: str
    aadhaar_no: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerResponse(CustomerBase):
    id: int
    current_balance: float

    class Config:
        from_attributes = True


# --- Universal Multi-Category Transaction Create Schema ---
class TransactionCreate(BaseModel):
    name: str
    phone: str
    aadhaar_no: Optional[str] = None
    
    # Category: 'KHAD', 'KHAL', ya 'KIRANA'
    category: str = "KHAD"
    
    # Khad specific fields
    fertilizer_type: Optional[str] = None
    company_name: Optional[str] = "Standard"
    
    # Khal & Kirana specific fields
    item_name: Optional[str] = None
    quantity: float = 1.0
    rate_per_unit: Optional[float] = None
    
    # Common billing fields
    bags_quantity: Optional[int] = None  # Fallback for Khad
    total_amount: float
    payment_status: str  # CASH ya UDHAR


# Backward Compatibility for existing endpoints
class TokenCreate(TransactionCreate):
    pass


# --- Universal Transaction Response Schema ---
class TransactionResponse(BaseModel):
    id: int
    customer_id: int
    category: str
    fertilizer_type: Optional[str] = None
    company_name: Optional[str] = None
    item_name: Optional[str] = None
    quantity: float
    rate_per_unit: Optional[float] = None
    bags_quantity: Optional[int] = None
    total_amount: float
    payment_status: str
    created_at: datetime

    class Config:
        from_attributes = True


# Backward Compatibility for TokenResponse
class TokenResponse(TransactionResponse):
    pass