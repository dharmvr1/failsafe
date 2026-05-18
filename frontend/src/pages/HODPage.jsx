import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { getDashboardSummary, getTopRiskFactors, getRiskDistribution } from "../api/api";

export default function HODPage() {
  const [summary, setSummary]   = useState(null);
  const [factors, setFactors]   = useState([]);
  const [distrib, setDistrib]   = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [s, f, d] = await Promise.all([
          getDashboardSummary(),
          getTopRiskFactors(),
          getRiskDistribution(),
        ]);
        setSummary(s.data);
        setFactors(f.data.top_risk_factors);
        setDistrib(d.data.distribution);
      } catch (err) {
        console.error("HOD fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  if (loading) return <Layout><p className="loading">Loading HOD overview...</p></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <h1>HOD Overview</h1>
        <p>Aggregate risk data across all faculty uploads</p>
      </div>

      {/* summary */}
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
            <p className="card-label">At-Risk Rate</p>
            <p className="card-value warning">
              {summary.total_students > 0
                ? ((summary.at_risk_count / summary.total_students) * 100).toFixed(1)
                : 0}%
            </p>
          </div>
          <div className="card">
            <p className="card-label">High Urgency</p>
            <p className="card-value danger">{summary.high_urgency}</p>
          </div>
          <div className="card">
            <p className="card-label">Interventions Applied</p>
            <p className="card-value success">{summary.interventions_applied}</p>
          </div>
          <div className="card">
            <p className="card-label">Pending Actions</p>
            <p className="card-value warning">{summary.interventions_pending}</p>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* risk distribution */}
        {distrib && (
          <div className="table-container">
            <div className="table-toolbar"><h3>Risk Score Distribution</h3></div>
            <div style={{ padding: "16px 20px" }}>
              {Object.entries(distrib).map(([bucket, count]) => {
                const total = Object.values(distrib).reduce((a, b) => a + b, 0);
                const pct   = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={bucket} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "#555" }}>{bucket}</span>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{count} students</span>
                    </div>
                    <div style={{ background: "#f0f0f0", borderRadius: 4, height: 10 }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          borderRadius: 4,
                          background: bucket === "76-100%" ? "#e94560"
                                    : bucket === "51-75%"  ? "#f39c12"
                                    : bucket === "26-50%"  ? "#3498db"
                                    : "#2ecc71",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* top risk factors */}
        <div className="table-container">
          <div className="table-toolbar"><h3>Top Risk Factors</h3></div>
          {factors.length === 0 ? (
            <div className="empty-state"><p>No at-risk students yet.</p></div>
          ) : (
            <table>
              <thead>
                <tr><th>#</th><th>Factor</th><th>Students</th></tr>
              </thead>
              <tbody>
                {factors.map((f, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{f.factor}</td>
                    <td style={{ fontWeight: 600, color: "#e94560" }}>{f.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </Layout>
  );
}
