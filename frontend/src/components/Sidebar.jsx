import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h2>FAILSAFE</h2>
        <p>Student Risk Prediction</p>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""}>
          📊 Dashboard
        </NavLink>
        <NavLink to="/upload" className={({ isActive }) => isActive ? "active" : ""}>
          📤 Upload Students
        </NavLink>
        <NavLink to="/students" className={({ isActive }) => isActive ? "active" : ""}>
          👥 All Students
        </NavLink>
        {user?.role === "hod" && (
          <NavLink to="/hod" className={({ isActive }) => isActive ? "active" : ""}>
            🏫 HOD Overview
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <p>{user?.name}</p>
        <span className="role-badge">{user?.role}</span>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
