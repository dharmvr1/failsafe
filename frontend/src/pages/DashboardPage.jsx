import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { getDashboardSummary, getTopRiskFactors } from "../api/api";

export default function DashboardPage() {
  const [summary, setSummary]     = useState(null);
  const [factors, setFactors]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        const [sumRes, facRes] = await Promise.all([
          getDashboardSummary(),
          getTopRiskFactors(),
        ]);
        setSummary(sumRes.data);
        setFactors(facRes.data.top_risk_factors);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <Layout><p className="loading">Loading dashboard...</p></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of student risk across all uploaded batches</p>
      </div>

      {/* summary cards */}
      {summary && (
        <div className="cards-grid">
          <div className="card">
            <p className="card-label">Total Students</p>
            <p className="card-value info">{summary.total_students}</p>
          </div>
          <div className="card">
            <p className="card-label">At Risk</p>
            <p className="card-value danger">{summary.at_risk_count}</p>
          </div>
          <div className="card">
            <p className="card-label">Safe</p>
            <p className="card-value success">{summary.safe_count}</p>
          </div>
          <div className="card">
            <p className="card-label">High Urgency</p>
            <p className="card-value danger">{summary.high_urgency}</p>
          </div>
          <div className="card">
            <p className="card-label">Interventions Done</p>
            <p className="card-value success">{summary.interventions_applied}</p>
          </div>
          <div className="card">
            <p className="card-label">Pending Action</p>
            <p className="card-value warning">{summary.interventions_pending}</p>
          </div>
        </div>
      )}

      {/* top risk factors table */}
      <div className="table-container" style={{ marginBottom: 24 }}>
        <div className="table-toolbar">
          <h3>Most Common Risk Factors Across At-Risk Students</h3>
        </div>
        {factors.length === 0 ? (
          <div className="empty-state">
            <p>No at-risk students yet. Upload a student CSV to get started.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Risk Factor</th>
                <th>Number of Students Affected</th>
              </tr>
            </thead>
            <tbody>
              {factors.map((f, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{f.factor}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, background: "#f0f0f0", borderRadius: 4, height: 8, maxWidth: 200 }}>
                        <div
                          style={{
                            width: `${(f.count / factors[0].count) * 100}%`,
                            background: "#e94560",
                            height: "100%",
                            borderRadius: 4,
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 13, color: "#333", fontWeight: 600 }}>{f.count}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* quick action */}
      <div style={{ display: "flex", gap: 12 }}>
        <button className="btn btn-primary" onClick={() => navigate("/upload")}>
          Upload New Batch
        </button>
        <button className="btn btn-outline" onClick={() => navigate("/students")}>
          View All Students
        </button>
      </div>
    </Layout>
  );
}
