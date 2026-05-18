from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json

from database import get_db
from models import Student, User
from jwt import get_current_user
from schemas import UpdateStudentRequest

router = APIRouter(prefix="/students", tags=["students"])


def _format_student(s: Student) -> dict:
    return {
        "id":                   s.id,
        "name":                 s.name,
        "roll_no":              s.roll_no,
        "subject":              s.subject,
        "risk_probability":     s.risk_probability,
        "risk_percentage":      round(s.risk_probability * 100, 1) if s.risk_probability else None,
        "at_risk":              s.at_risk,
        "urgency":              s.urgency,
        "top_factors":          json.loads(s.top_factors_json) if s.top_factors_json else [],
        "interventions":        json.loads(s.intervention_json) if s.intervention_json else [],
        "intervention_applied": s.intervention_applied,
        "notes":                s.notes,
        "uploaded_by":          s.uploaded_by,
        "created_at":           s.created_at.isoformat(),
    }


@router.get("/")
def get_all_students(
    at_risk: bool = None,
    urgency: str = None,
    subject: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all students uploaded by the current faculty member.
    HOD can see all students.
    Optional filters: at_risk, urgency, subject
    """
    query = db.query(Student)

    # faculty only see their own uploads; HOD sees everyone
    if current_user.role == "faculty":
        query = query.filter(Student.uploaded_by == current_user.id)

    if at_risk is not None:
        query = query.filter(Student.at_risk == at_risk)

    if urgency:
        query = query.filter(Student.urgency == urgency)

    if subject:
        query = query.filter(Student.subject == subject)

    students = query.order_by(Student.risk_probability.desc()).all()

    return {
        "total":    len(students),
        "students": [_format_student(s) for s in students],
    }


@router.get("/{student_id}")
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.query(Student).filter(Student.id == student_id).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # faculty can only view their own students
    if current_user.role == "faculty" and student.uploaded_by != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return _format_student(student)


@router.patch("/{student_id}")
def update_student(
    student_id: int,
    body: UpdateStudentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark intervention as applied or add notes.
    """
    student = db.query(Student).filter(Student.id == student_id).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if current_user.role == "faculty" and student.uploaded_by != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if body.intervention_applied is not None:
        student.intervention_applied = body.intervention_applied

    if body.notes is not None:
        student.notes = body.notes

    db.commit()
    db.refresh(student)

    return {"message": "Student updated", "student": _format_student(student)}


@router.delete("/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.query(Student).filter(Student.id == student_id).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if current_user.role == "faculty" and student.uploaded_by != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    db.delete(student)
    db.commit()

    return {"message": f"Student {student_id} deleted"}
