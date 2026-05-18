import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { getStudents } from "../api/api";

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [riskFilter, setRiskFilter]   = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchStudents() {
      try {
        const res = await getStudents();
        setStudents(res.data.students);
        setFiltered(res.data.students);
      } catch (err) {
        console.error("Failed to load students:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, []);

  // apply filters whenever any filter changes
  useEffect(() => {
    let list = [...students];

    if (search) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.roll_no.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (riskFilter === "at_risk") list = list.filter((s) => s.at_risk);
    if (riskFilter === "safe")    list = list.filter((s) => !s.at_risk);

    if (urgencyFilter !== "all") list = list.filter((s) => s.urgency === urgencyFilter);

    setFiltered(list);
  }, [search, riskFilter, urgencyFilter, students]);

  if (loading) return <Layout><p className="loading">Loading students...</p></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <h1>All Students</h1>
        <p>{students.length} students loaded — click any row to see full details and intervention plan</p>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <h3>Student List ({filtered.length})</h3>
          <div className="table-filters">
            <input
              type="text"
              placeholder="Search name or roll no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 12 }}
            />
            <select
              className="filter-select"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
            >
              <option value="all">All Students</option>
              <option value="at_risk">At Risk Only</option>
              <option value="safe">Safe Only</option>
            </select>
            <select
              className="filter-select"
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
            >
              <option value="all">All Urgencies</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <p>No students found. Try adjusting your filters or upload a batch.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Roll No</th>
                <th>Subject</th>
                <th>Risk %</th>
                <th>Status</th>
                <th>Urgency</th>
                <th>Intervention</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/students/${s.id}`)}
                >
                  <td style={{ fontWeight: 500 }}>{s.name}</td>
                  <td style={{ color: "#888" }}>{s.roll_no}</td>
                  <td style={{ textTransform: "capitalize" }}>{s.subject}</td>
                  <td style={{ fontWeight: 600, color: s.at_risk ? "#e94560" : "#27ae60" }}>
                    {s.risk_percentage}%
                  </td>
                  <td>
                    {s.at_risk
                      ? <span className="badge badge-high">At Risk</span>
                      : <span className="badge badge-safe">Safe</span>
                    }
                  </td>
                  <td>
                    {s.urgency && (
                      <span className={`badge badge-${s.urgency}`}>{s.urgency}</span>
                    )}
                  </td>
                  <td>
                    {s.intervention_applied
                      ? <span className="badge badge-applied">Applied</span>
                      : s.at_risk
                        ? <span style={{ fontSize: 12, color: "#e94560" }}>Pending</span>
                        : <span style={{ fontSize: 12, color: "#aaa" }}>—</span>
                    }
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => navigate(`/students/${s.id}`)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
