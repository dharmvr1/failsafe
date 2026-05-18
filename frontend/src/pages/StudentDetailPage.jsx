import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { getStudent, updateStudent } from "../api/api";

export default function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes]     = useState("");
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    async function fetchStudent() {
      try {
        const res = await getStudent(id);
        setStudent(res.data);
        setNotes(res.data.notes || "");
      } catch (err) {
        console.error("Failed to load student:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStudent();
  }, [id]);

  async function handleMarkApplied() {
    setSaving(true);
    try {
      const res = await updateStudent(id, { intervention_applied: true });
      setStudent(res.data.student);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to update:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveNotes() {
    setSaving(true);
    try {
      const res = await updateStudent(id, { notes });
      setStudent(res.data.student);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save notes:", err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Layout><p className="loading">Loading student...</p></Layout>;
  if (!student) return <Layout><p className="loading">Student not found.</p></Layout>;

  // find max SHAP magnitude for bar scaling
  const maxMag = student.top_factors?.length > 0
    ? Math.max(...student.top_factors.map((f) => f.magnitude))
    : 1;

  return (
    <Layout>
      <div className="back-link" onClick={() => navigate("/students")}>
        ← Back to Students
      </div>

      <div className="page-header">
        <h1>{student.name}</h1>
        <p>Roll No: {student.roll_no} &nbsp;|&nbsp; Subject: {student.subject.toUpperCase()}</p>
      </div>

      <div className="detail-grid">

        {/* Risk Score Card */}
        <div className="detail-card">
          <h3>Risk Score</h3>
          <div className="risk-score-display">
            <div className={`score ${student.urgency}`}>
              {student.risk_percentage}%
            </div>
            <div className="label">Predicted Failure Risk</div>
            <div style={{ marginTop: 12 }}>
              {student.at_risk
                ? <span className="badge badge-high">At Risk</span>
                : <span className="badge badge-safe">Safe</span>
              }
              &nbsp;&nbsp;
              {student.urgency && (
                <span className={`badge badge-${student.urgency}`}>
                  {student.urgency} urgency
                </span>
              )}
            </div>
          </div>

          {/* Intervention toggle */}
          <div style={{ marginTop: 20, borderTop: "1px solid #f0f0f0", paddingTop: 16 }}>
            {student.intervention_applied ? (
              <p style={{ fontSize: 13, color: "#27ae60", fontWeight: 600 }}>
                ✓ Intervention marked as applied
              </p>
            ) : (
              <button
                className="btn btn-primary"
                style={{ width: "100%" }}
                onClick={handleMarkApplied}
                disabled={saving || !student.at_risk}
              >
                {saving ? "Saving..." : "Mark Intervention as Applied"}
              </button>
            )}
          </div>
        </div>

        {/* SHAP Factors Card */}
        <div className="detail-card">
          <h3>Why is this student flagged?</h3>
          <p style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>
            SHAP values show which factors are driving the risk prediction.
            Red bars increase risk, green bars reduce it.
          </p>

          {student.top_factors?.length > 0 ? (
            student.top_factors.map((f, i) => (
              <div key={i} className="factor-row">
                <span className="factor-name">{f.label}</span>
                <div className="factor-bar-wrap">
                  <div
                    className={`factor-bar ${f.direction === "increases_risk" ? "risk" : "protect"}`}
                    style={{ width: `${(f.magnitude / maxMag) * 100}%` }}
                  />
                </div>
                <span className="factor-value">
                  {f.direction === "increases_risk" ? "+" : "-"}{f.magnitude.toFixed(3)}
                </span>
              </div>
            ))
          ) : (
            <p style={{ color: "#aaa", fontSize: 13 }}>No SHAP data available.</p>
          )}
        </div>

        {/* Intervention Plan */}
        <div className="detail-card full-width">
          <h3>Personalised Intervention Plan</h3>

          {student.interventions?.length > 0 ? (
            student.interventions.map((iv, i) => (
              <div key={i} className="intervention-item">
                <h4>{iv.title}</h4>
                <p>{iv.description}</p>
                <p className="action">→ {iv.action}</p>
              </div>
            ))
          ) : (
            <p style={{ color: "#aaa", fontSize: 13 }}>
              No interventions needed — student is not at risk.
            </p>
          )}
        </div>

        {/* Faculty Notes */}
        <div className="detail-card full-width">
          <h3>Faculty Notes</h3>
          <textarea
            className="notes-textarea"
            placeholder="Add notes about this student, actions taken, follow-up dates..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
            <button className="btn btn-outline btn-sm" onClick={handleSaveNotes} disabled={saving}>
              {saving ? "Saving..." : "Save Notes"}
            </button>
            {saved && <span style={{ fontSize: 12, color: "#27ae60" }}>✓ Saved</span>}
          </div>
        </div>

      </div>
    </Layout>
  );
}
