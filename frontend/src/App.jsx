import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import LoginPage         from "./pages/LoginPage";
import RegisterPage      from "./pages/RegisterPage";
import DashboardPage     from "./pages/DashboardPage";
import UploadPage        from "./pages/UploadPage";
import StudentsPage      from "./pages/StudentsPage";
import StudentDetailPage from "./pages/StudentDetailPage";
import HODPage           from "./pages/HODPage";

import "./index.css";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"        element={<LoginPage />} />
          <Route path="/register"     element={<RegisterPage />} />
          <Route path="/dashboard"    element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/upload"       element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
          <Route path="/students"     element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
          <Route path="/students/:id" element={<ProtectedRoute><StudentDetailPage /></ProtectedRoute>} />
          <Route path="/hod"          element={<ProtectedRoute><HODPage /></ProtectedRoute>} />
          <Route path="*"             element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
