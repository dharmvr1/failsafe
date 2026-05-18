from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://dharm:khokhar@localhost:5432/failsafe_db")

engine = create_engine(DATABASE_URL)

# each request gets its own session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# dependency — used in route functions
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
