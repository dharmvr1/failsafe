import axios from "axios";

const BASE_URL = "http://localhost:8000";

// create axios instance
const api = axios.create({
  baseURL: BASE_URL,
});

// attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// if token expires, redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ── Auth ───────────────────────────────────────────────
export const registerUser = (data) => api.post("/auth/register", data);
export const loginUser    = (data) => api.post("/auth/login", data);

// ── Upload ────────────────────────────────────────────
export const uploadCSV = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/upload/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// ── Students ──────────────────────────────────────────
export const getStudents      = (params) => api.get("/students/", { params });
export const getStudent       = (id)     => api.get(`/students/${id}`);
export const updateStudent    = (id, data) => api.patch(`/students/${id}`, data);
export const deleteStudent    = (id)     => api.delete(`/students/${id}`);

// ── Dashboard ─────────────────────────────────────────
export const getDashboardSummary      = () => api.get("/dashboard/summary");
export const getRiskDistribution      = () => api.get("/dashboard/risk-distribution");
export const getTopRiskFactors        = () => api.get("/dashboard/top-risk-factors");

export default api;
