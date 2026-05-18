import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { uploadCSV } from "../api/api";

export default function UploadPage() {
  const [file, setFile]         = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [results, setResults]   = useState(null);

  const inputRef = useNavigate();
  const fileRef  = useRef();
  const navigate = useNavigate();

  function handleFileSelect(selectedFile) {
    if (selectedFile && selectedFile.name.endsWith(".csv")) {
      setFile(selectedFile);
      setError("");
      setResults(null);
    } else {
      setError("Please select a valid CSV file.");
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    handleFileSelect(dropped);
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError("");

    try {
      const res = await uploadCSV(file);
      setResults(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed. Check your CSV format.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <h1>Upload Students</h1>
        <p>Upload a CSV file with student data to run risk predictions</p>
      </div>

      {/* upload area */}
      <div
        className={`upload-area ${dragOver ? "drag-over" : ""}`}
        onClick={() => fileRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="upload-icon">📂</div>
        <h3>Drag & drop your CSV here</h3>
        <p>or click to browse — must include all student feature columns</p>

        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          style={{ display: "none" }}
          onChange={(e) => handleFileSelect(e.target.files[0])}
        />
      </div>

      {/* selected file info */}
      {file && (
        <div className="file-selected">
          <span>✓ {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
          <button
            className="btn btn-outline btn-sm"
            onClick={(e) => { e.stopPropagation(); setFile(null); setResults(null); }}
          >
            Remove
          </button>
        </div>
      )}

      {error && <p className="error-msg" style={{ marginTop: 10 }}>{error}</p>}

      {/* upload button */}
      {file && !results && (
        <button
          className="btn btn-primary"
          style={{ marginTop: 16 }}
          onClick={handleUpload}
          disabled={loading}
        >
          {loading ? "Running predictions..." : "Run Predictions"}
        </button>
      )}

      {/* results after upload */}
      {results && (
        <div style={{ marginTop: 28 }}>
          <div className="results-summary">
            <div className="result-card">
              <div className="num">{results.total}</div>
              <div className="lbl">Total Processed</div>
            </div>
            <div className="result-card">
              <div className="num" style={{ color: "#e94560" }}>{results.at_risk_count}</div>
              <div className="lbl">At Risk</div>
            </div>
            <div className="result-card">
              <div className="num" style={{ color: "#2ecc71" }}>{results.safe_count}</div>
              <div className="lbl">Safe</div>
            </div>
          </div>

          <div className="table-container">
            <div className="table-toolbar">
              <h3>Prediction Results</h3>
              <button className="btn btn-outline btn-sm" onClick={() => navigate("/students")}>
                View All Students →
              </button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Roll No</th>
                  <th>Risk %</th>
                  <th>Status</th>
                  <th>Urgency</th>
                </tr>
              </thead>
              <tbody>
                {results.students.map((s, i) => (
                  <tr key={i}>
                    <td>{s.name}</td>
                    <td>{s.roll_no}</td>
                    <td style={{ fontWeight: 600 }}>{(s.risk_probability * 100).toFixed(1)}%</td>
                    <td>
                      {s.at_risk
                        ? <span className="badge badge-high">At Risk</span>
                        : <span className="badge badge-safe">Safe</span>
                      }
                    </td>
                    <td>
                      {s.urgency && (
                        <span className={`badge badge-${s.urgency}`}>
                          {s.urgency}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CSV format guide */}
      <div className="table-container" style={{ marginTop: 28 }}>
        <div className="table-toolbar">
          <h3>What CSV can I upload?</h3>
        </div>
        <div style={{ padding: "16px 20px" }}>
          <p style={{ fontSize: 13, color: "#333", marginBottom: 12, fontWeight: 600 }}>
            Option 1 — Upload the raw UCI dataset files directly
          </p>
          <p style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
            Just upload <code style={{ background: "#f0f0f0", padding: "1px 5px", borderRadius: 3 }}>student-mat.csv</code> or <code style={{ background: "#f0f0f0", padding: "1px 5px", borderRadius: 3 }}>student-por.csv</code> as downloaded from Kaggle.
            Both use semicolons as separators — the system handles that automatically.
            Student names will be auto-generated as Student_1, Student_2, etc.
          </p>

          <p style={{ fontSize: 13, color: "#333", margin: "16px 0 8px", fontWeight: 600 }}>
            Option 2 — Upload your own CSV with real student names
          </p>
          <p style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
            Add a <code style={{ background: "#f0f0f0", padding: "1px 5px", borderRadius: 3 }}>name</code> and <code style={{ background: "#f0f0f0", padding: "1px 5px", borderRadius: 3 }}>roll_no</code> column to the UCI dataset columns.
            Use a comma as separator.
          </p>

          <p style={{ fontSize: 12, color: "#888", marginTop: 12, marginBottom: 6 }}>Required feature columns (must exist in either case):</p>
          <code style={{ fontSize: 11, color: "#555", lineHeight: 1.8, display: "block", background: "#f8f9fb", padding: 12, borderRadius: 6 }}>
            age, sex, address, famsize, Pstatus, Medu, Fedu, Mjob, Fjob, reason, guardian,
            traveltime, studytime, failures, schoolsup, famsup, paid, activities, nursery,
            higher, internet, romantic, famrel, freetime, goout, Dalc, Walc, health, absences, G1, G2
          </code>
        </div>
      </div>
    </Layout>
  );
}