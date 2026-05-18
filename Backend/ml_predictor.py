import joblib
import json
import pandas as pd
import numpy as np
import os

# paths relative to where main.py is run from
# project root is 2 levels up from this file (backend/app/ml_predictor.py -> backend/app -> backend -> failsafe)
_here = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(_here, "..", "ml_pipeline")

# loaded once at startup
_model          = None
_explainer      = None
_label_encoders = None
_feature_cols   = None
_config         = None


def load_model():
    global _model, _explainer, _label_encoders, _feature_cols, _config
    print("Loading ML model...")
    _model          = joblib.load(os.path.join(MODEL_DIR, "model.pkl"))
    _explainer      = joblib.load(os.path.join(MODEL_DIR, "explainer.pkl"))
    _label_encoders = joblib.load(os.path.join(MODEL_DIR, "label_encoders.pkl"))
    _feature_cols   = joblib.load(os.path.join(MODEL_DIR, "feature_columns.pkl"))
    _config         = joblib.load(os.path.join(MODEL_DIR, "config.pkl"))
    print("Model loaded successfully.")


# human-readable labels for SHAP features
FACTOR_LABELS = {
    "absences":         "Attendance record",
    "G1":               "First period grade",
    "G2":               "Second period grade",
    "failures":         "Number of past failures",
    "studytime":        "Weekly study time",
    "Dalc":             "Weekday alcohol consumption",
    "Walc":             "Weekend alcohol consumption",
    "total_alcohol":    "Overall alcohol consumption",
    "grade_trend":      "Grade trajectory (G2 - G1)",
    "study_efficiency": "Grade-to-study-effort ratio",
    "goout":            "Time spent going out",
    "famrel":           "Family relationship quality",
    "health":           "Current health status",
    "Medu":             "Mother's education level",
    "Fedu":             "Father's education level",
    "higher":           "Aspiration for higher education",
    "internet":         "Internet access at home",
    "famsup":           "Family educational support",
    "freetime":         "Free time after school",
    "traveltime":       "Home-to-school travel time",
    "romantic":         "In a romantic relationship",
    "schoolsup":        "Extra school support",
    "paid":             "Extra paid classes",
    "age":              "Student age",
    "activities":       "Extra-curricular activities",
}

INTERVENTIONS = {
    "absences":         ("Attendance counselling",      "Student has high absences. Schedule a one-on-one attendance review and set weekly check-ins."),
    "failures":         ("Remedial support",            "Past failures indicate knowledge gaps. Enroll in remedial class and assign a peer mentor."),
    "G1":               ("Early academic support",      "Low first-period grade. Review foundational concepts and schedule extra practice sessions."),
    "G2":               ("Urgent academic support",     "Mid-term grade is critically low. Immediate tutoring required. Inform HOD."),
    "grade_trend":      ("Arrest grade decline",        "Grades are declining. Create a structured weekly study plan and track monthly."),
    "studytime":        ("Study time intervention",     "Student studies very few hours per week. Issue a personalised study timetable."),
    "study_efficiency": ("Study skills workshop",       "Low grade output relative to study hours. Refer to a study skills workshop."),
    "Dalc":             ("Wellness referral",           "Elevated weekday alcohol use. Confidential referral to student wellness centre."),
    "Walc":             ("Wellness check-in",           "Weekend alcohol use is high. Private welfare conversation recommended."),
    "total_alcohol":    ("Wellness referral",           "Overall alcohol consumption is high. Coordinate with student wellness team."),
    "goout":            ("Time management session",     "High social time may be reducing study time. Time management counselling recommended."),
    "famrel":           ("Pastoral care",               "Poor family relationships reported. Refer to pastoral care or counselling services."),
    "health":           ("Health check",                "Poor health status. Encourage a campus health check and review academic workload."),
    "internet":         ("Resource support",            "No internet at home. Arrange library access and provide offline revision materials."),
    "famsup":           ("Faculty mentorship",          "No family academic support. Assign faculty mentor with bi-weekly check-ins."),
    "higher":           ("Motivation counselling",      "Student not aiming for higher education. Career counselling session recommended."),
    "Medu":             ("Additional resources",        "Low parental education background. Provide extra resource guides and support."),
    "Fedu":             ("Additional resources",        "Low parental education background. Provide extra resource guides and support."),
    "romantic":         ("Work-life balance talk",      "Romantic relationship may be affecting focus. Supportive conversation about balance."),
    "traveltime":       ("Transport support",           "Long commute causing fatigue. Explore hostel availability or transport subsidy."),
}


def _preprocess(row: dict) -> pd.DataFrame:
    row = dict(row)

    # engineered features
    row["total_alcohol"]    = row.get("Dalc", 1) + row.get("Walc", 1)
    row["grade_trend"]      = row.get("G2", 0) - row.get("G1", 0)
    row["study_efficiency"] = row.get("G1", 0) / (row.get("studytime", 1) + 1)

    # encode categoricals
    for col, le in _label_encoders.items():
        if col in row:
            val = str(row[col])
            if val in le.classes_:
                row[col] = int(le.transform([val])[0])
            else:
                row[col] = int(le.transform([le.classes_[0]])[0])

    return pd.DataFrame([row])[_feature_cols]


def predict_single(row: dict) -> dict:
    threshold = _config.get("threshold", 0.40)

    df = _preprocess(row)
    prob = float(_model.predict_proba(df)[0][1])
    at_risk = prob >= threshold

    # SHAP
    shap_vals = _explainer.shap_values(df)[0]
    factors = sorted(zip(_feature_cols, shap_vals), key=lambda x: abs(x[1]), reverse=True)

    top_factors = []
    for feat, sv in factors[:5]:
        top_factors.append({
            "feature":   feat,
            "label":     FACTOR_LABELS.get(feat, feat),
            "shap_value": round(float(sv), 4),
            "direction": "increases_risk" if sv > 0 else "reduces_risk",
            "magnitude": round(abs(float(sv)), 4),
        })

    # interventions — only for factors pushing risk up
    interventions = []
    seen = set()
    for f in top_factors:
        feat = f["feature"]
        if f["direction"] == "increases_risk" and feat in INTERVENTIONS and feat not in seen:
            title, desc = INTERVENTIONS[feat]
            interventions.append({
                "title":           title,
                "description":     desc,
                "action":          desc.split(".")[1].strip() if "." in desc else desc,
                "type":            "academic" if feat in ["G1","G2","failures","studytime","absences"] else "counselling",
                "trigger_feature": feat,
                "trigger_label":   FACTOR_LABELS.get(feat, feat),
            })
            seen.add(feat)

    urgency = "high" if prob > 0.75 else "medium" if prob > 0.50 else "low"

    return {
        "risk_probability": round(prob, 4),
        "at_risk":          bool(at_risk),
        "urgency":          urgency,
        "top_factors":      top_factors,
        "interventions":    interventions,
    }


def predict_batch(rows: list[dict]) -> list[dict]:
    return [predict_single(row) for row in rows]
