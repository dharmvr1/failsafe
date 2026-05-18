from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import RegisterRequest, LoginRequest, TokenResponse
from jwt import hash_password, verify_password, create_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    # check email not already taken
    existing = db.query(User).filter(User.email == body.email).first()
    print(body)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    if body.role not in ("faculty", "hod"):
        raise HTTPException(status_code=400, detail="Role must be 'faculty' or 'hod'")

    user = User(
        name=body.name,
        email=body.email,
        hashed_password=hash_password(body.password),
        role=body.role,
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token({"user_id": user.id, "role": user.role})
    return TokenResponse(access_token=token, role=user.role, name=user.name)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token({"user_id": user.id, "role": user.role})
    return TokenResponse(access_token=token, role=user.role, name=user.name)
