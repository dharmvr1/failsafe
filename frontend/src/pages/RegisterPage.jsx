import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const [form, setForm]     = useState({ name: "", email: "", password: "", role: "faculty" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await registerUser(form);
      login(
        { name: res.data.name, role: res.data.role },
        res.data.access_token
      );
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h1><span className="brand">FAILSAFE</span></h1>
        <p className="subtitle">Create your account</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              name="name"
              placeholder="Dr. Priya Sharma"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              name="email"
              type="email"
              placeholder="you@college.edu"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Role</label>
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="faculty">Faculty</option>
              <option value="hod">HOD (Head of Department)</option>
            </select>
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "8px", padding: "11px" }}
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
