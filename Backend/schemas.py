from pydantic import BaseModel, EmailStr
from typing import Optional, List
import datetime


# ── Auth ───────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "faculty"   # faculty or hod


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str


# ── Student ────────────────────────────────────────────

class TopFactor(BaseModel):
    feature: str
    label: str
    shap_value: float
    direction: str
    magnitude: float


class InterventionItem(BaseModel):
    title: str
    description: str
    action: str
    type: str
    trigger_feature: str
    trigger_label: str


class StudentResponse(BaseModel):
    id: int
    name: str
    roll_no: str
    subject: str
    risk_probability: Optional[float]
    at_risk: Optional[bool]
    urgency: Optional[str]
    top_factors: Optional[List[TopFactor]]
    interventions: Optional[List[InterventionItem]]
    intervention_applied: bool
    notes: Optional[str]
    uploaded_by: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class UpdateStudentRequest(BaseModel):
    intervention_applied: Optional[bool] = None
    notes: Optional[str] = None


# ── Dashboard ──────────────────────────────────────────

class DashboardSummary(BaseModel):
    total_students: int
    at_risk_count: int
    safe_count: int
    interventions_applied: int
    high_urgency: int
    medium_urgency: int
    low_urgency: int
