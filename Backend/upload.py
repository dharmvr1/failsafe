from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
import json
import io

from database import get_db
from models import Student, User
from jwt import get_current_user
from ml_predictor import predict_batch

router = APIRouter(prefix="/upload", tags=["upload"])

# the actual ML feature columns — no name/roll_no needed
FEATURE_COLS = [
    "age", "sex", "address", "famsize", "Pstatus",
    "Medu", "Fedu", "Mjob", "Fjob", "reason", "guardian",
    "traveltime", "studytime", "failures",
    "schoolsup", "famsup", "paid", "activities", "nursery",
    "higher", "internet", "romantic",
    "famrel", "freetime", "goout", "Dalc", "Walc", "health", "absences",
    "G1", "G2"
]


@router.post("/")
async def upload_students(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")

    # read file — try semicolon separator first (UCI format), then comma
    content = await file.read()
    try:
        text = content.decode("utf-8")
        # UCI dataset uses semicolons
        if ";" in text.split("\n")[0]:
            df = pd.read_csv(io.StringIO(text), sep=";")
        else:
            df = pd.read_csv(io.StringIO(text))
    except Exception:
        raise HTTPException(status_code=400, detail="Could not parse CSV file")

    # check that the actual feature columns exist
    missing_cols = [c for c in FEATURE_COLS if c not in df.columns]
    if missing_cols:
        raise HTTPException(
            status_code=400,
            detail=f"CSV is missing these columns: {missing_cols}"
        )

    # name and roll_no are optional — auto-generate if not present
    if "name" not in df.columns:
        df["name"] = [f"Student_{i+1}" for i in range(len(df))]
    if "roll_no" not in df.columns:
        df["roll_no"] = [f"ROLL_{str(i+1).zfill(3)}" for i in range(len(df))]

    # subject column is optional
    if "subject" not in df.columns:
        df["subject"] = "math"

    # run batch prediction
    rows = df[FEATURE_COLS].to_dict(orient="records")
    predictions = predict_batch(rows)

    saved_students = []

    for i, (_, row) in enumerate(df.iterrows()):
        pred = predictions[i]

        student = Student(
            name=str(row["name"]),
            roll_no=str(row["roll_no"]),
            subject=str(row.get("subject", "math")),
            features_json=json.dumps(rows[i]),
            risk_probability=pred["risk_probability"],
            at_risk=pred["at_risk"],
            urgency=pred["urgency"],
            top_factors_json=json.dumps(pred["top_factors"]),
            intervention_json=json.dumps(pred["interventions"]),
            uploaded_by=current_user.id,
        )
        db.add(student)
        saved_students.append({
            "name":             student.name,
            "roll_no":          student.roll_no,
            "risk_probability": pred["risk_probability"],
            "at_risk":          pred["at_risk"],
            "urgency":          pred["urgency"],
        })

    db.commit()

    at_risk_count = sum(1 for s in saved_students if s["at_risk"])

    return {
        "message":       f"Processed {len(saved_students)} students",
        "total":         len(saved_students),
        "at_risk_count": at_risk_count,
        "safe_count":    len(saved_students) - at_risk_count,
        "students":      saved_students,
    }