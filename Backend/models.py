from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base
import datetime


class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    name            = Column(String, nullable=False)
    email           = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role            = Column(String, default="faculty")   # "faculty" or "hod"
    created_at      = Column(DateTime, default=datetime.datetime.utcnow)

    students = relationship("Student", back_populates="faculty")


class Student(Base):
    __tablename__ = "students"

    id                   = Column(Integer, primary_key=True, index=True)
    name                 = Column(String, nullable=False)
    roll_no              = Column(String, nullable=False)
    subject              = Column(String, default="math")     # math or por

    # raw input features stored as JSON string
    features_json        = Column(Text, nullable=True)

    # prediction results
    risk_probability     = Column(Float, nullable=True)
    at_risk              = Column(Boolean, nullable=True)
    urgency              = Column(String, nullable=True)       # high / medium / low

    # SHAP explanation stored as JSON string
    top_factors_json     = Column(Text, nullable=True)

    # intervention plan stored as JSON string
    intervention_json    = Column(Text, nullable=True)

    # tracking
    intervention_applied = Column(Boolean, default=False)
    notes                = Column(Text, nullable=True)
    uploaded_by          = Column(Integer, ForeignKey("users.id"))
    created_at           = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at           = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    faculty = relationship("User", back_populates="students")
