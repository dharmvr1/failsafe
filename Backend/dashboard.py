from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Student, User
from jwt import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns counts for the dashboard cards.
    Faculty sees only their students, HOD sees all.
    """
    query = db.query(Student)

    if current_user.role == "faculty":
        query = query.filter(Student.uploaded_by == current_user.id)

    all_students = query.all()

    total               = len(all_students)
    at_risk_count       = sum(1 for s in all_students if s.at_risk)
    safe_count          = total - at_risk_count
    interventions_done  = sum(1 for s in all_students if s.intervention_applied)
    high_urgency        = sum(1 for s in all_students if s.urgency == "high")
    medium_urgency      = sum(1 for s in all_students if s.urgency == "medium")
    low_urgency         = sum(1 for s in all_students if s.urgency == "low")

    return {
        "total_students":        total,
        "at_risk_count":         at_risk_count,
        "safe_count":            safe_count,
        "interventions_applied": interventions_done,
        "interventions_pending": at_risk_count - interventions_done,
        "high_urgency":          high_urgency,
        "medium_urgency":        medium_urgency,
        "low_urgency":           low_urgency,
    }


@router.get("/risk-distribution")
def get_risk_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns risk probability buckets for charting.
    """
    query = db.query(Student)
    if current_user.role == "faculty":
        query = query.filter(Student.uploaded_by == current_user.id)

    students = query.all()

    buckets = {"0-25%": 0, "26-50%": 0, "51-75%": 0, "76-100%": 0}

    for s in students:
        if s.risk_probability is None:
            continue
        pct = s.risk_probability * 100
        if pct <= 25:
            buckets["0-25%"] += 1
        elif pct <= 50:
            buckets["26-50%"] += 1
        elif pct <= 75:
            buckets["51-75%"] += 1
        else:
            buckets["76-100%"] += 1

    return {"distribution": buckets}


@router.get("/top-risk-factors")
def get_top_risk_factors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Across all at-risk students, which SHAP factors appear most often as top driver.
    Useful for HOD to see class-wide patterns.
    """
    import json
    from collections import Counter

    query = db.query(Student).filter(Student.at_risk == True)
    if current_user.role == "faculty":
        query = query.filter(Student.uploaded_by == current_user.id)

    students = query.all()

    factor_counts = Counter()
    for s in students:
        if s.top_factors_json:
            factors = json.loads(s.top_factors_json)
            for f in factors[:3]:   # top 3 per student
                if f["direction"] == "increases_risk":
                    factor_counts[f["label"]] += 1

    top_factors = [
        {"factor": label, "count": count}
        for label, count in factor_counts.most_common(10)
    ]

    return {"top_risk_factors": top_factors}
