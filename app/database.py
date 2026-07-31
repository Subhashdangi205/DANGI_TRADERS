import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# .env file load karne ke liye
load_dotenv()

# .env se DATABASE_URL le raha hai, nahi mila toh SQLite fallback
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./dangi_traders.db"
)

# SQLite ke liye check_same_thread chahiye hota hai, PostgreSQL ke liye nahi
connect_args = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# Database Session Injection Helper
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()