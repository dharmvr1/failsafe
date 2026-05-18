from jose import JWTError,jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv

from database import get_db
from models import User

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "changethis")
ALGORITHM  = "HS256"
EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))

pwd_context    = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme  = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(password: str) -> str:
    print(password)
    print(type(password))
    print(len(password.encode("utf-8")))
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=EXPIRE_MINUTES)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise credentials_error
    except JWTError:
        raise credentials_error

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_error
    return user


def require_hod(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "hod":
        raise HTTPException(status_code=403, detail="HOD access required")
    return current_user
