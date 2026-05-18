# failSafe - Student Failure Prediction System

A full-stack machine learning application that predicts student academic failure using explainable AI. The system combines a FastAPI backend, React frontend, and ML pipeline to provide insights into student performance and risk factors.

## 📋 Project Overview

**failSafe** is designed to:
- Predict student academic failures with high accuracy
- Provide explainable AI insights into prediction factors
- Allow educators to upload and manage student data
- Display dashboards with risk assessments and analytics
- Secure student data with JWT authentication

### Key Features
- 🔐 **JWT Authentication** - Secure access control
- 📊 **Interactive Dashboards** - Visualize student risk levels
- 🤖 **ML Predictions** - Trained models for failure prediction
- 📈 **Explainable AI** - SHAP-based model interpretability
- 📤 **Bulk Upload** - Import student data via CSV
- 🔄 **Real-time Analysis** - Live data processing

## 🏗️ Project Structure

```
failSafe/
├── Backend/                 # FastAPI REST API
│   ├── main.py             # Application entry point
│   ├── auth.py             # Authentication endpoints
│   ├── database.py         # Database configuration
│   ├── models.py           # SQLAlchemy models
│   ├── schemas.py          # Pydantic request/response schemas
│   ├── students.py         # Student management endpoints
│   ├── upload.py           # File upload handling
│   ├── dashboard.py        # Dashboard analytics endpoints
│   ├── jwt.py              # JWT token utilities
│   └── ml_predictor.py     # ML model inference
├── frontend/               # React SPA
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   └── App.jsx         # Main app component
│   ├── package.json        # Node dependencies
│   └── public/             # Static assets
├── ml_pipeline/            # Machine Learning Models
│   ├── EDA.ipynb          # Exploratory data analysis
│   ├── model_training.ipynb # Model training notebook
│   ├── model.pkl           # Trained model
│   ├── explainer.pkl       # SHAP explainer
│   ├── label_encoders.pkl  # Feature encoders
│   ├── feature_columns.pkl # Feature list
│   └── config.pkl          # ML config
├── data/                   # Student data
└── outputs/                # Prediction outputs
```

## 🚀 Getting Started

### Prerequisites
- **Python 3.9+**
- **Node.js 16+** and npm
- **SQLite** (or PostgreSQL)

### Backend Setup

1. **Install Python dependencies:**
   ```bash
   cd Backend
   pip install fastapi uvicorn sqlalchemy pydantic python-dotenv pyjwt scikit-learn shap pandas numpy
   ```

2. **Create environment file** (optional):
   ```bash
   # Create .env in Backend directory
   echo "DATABASE_URL=sqlite:///./failsafe.db" > .env
   echo "JWT_SECRET=your-secret-key-here" >> .env
   echo "JWT_ALGORITHM=HS256" >> .env
   ```

3. **Run the API server:**
   ```bash
   cd Backend
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
   - API will be available at `http://localhost:8000`
   - Interactive docs at `http://localhost:8000/docs`

### Frontend Setup

1. **Install Node dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure API endpoint** (if needed):
   - Update API base URL in environment or axios config
   - Default: `http://localhost:8000`

3. **Start the development server:**
   ```bash
   npm start
   ```
   - Application will open at `http://localhost:3000`

### ML Pipeline Setup

The ML models are pre-trained. To use them:

1. **Load models:**
   - Models are automatically loaded on backend startup
   - Located in `/ml_pipeline/` directory

2. **Optional - Retrain models:**
   ```bash
   # Use the Jupyter notebooks
   cd ml_pipeline
   jupyter notebook model_training.ipynb
   ```

## 🔧 Configuration

### Backend Configuration

Key environment variables in `Backend/main.py`:
- `DATABASE_URL` - Database connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_ALGORITHM` - Algorithm for JWT (default: HS256)
- CORS settings for frontend URLs

### Frontend Configuration

API endpoints configured in:
- Axios instance (typically in `src/services/api.js` or similar)
- Environment variables in `.env` (if using Create React App)

## 📚 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token

### Students
- `GET /students/` - List all students
- `GET /students/{student_id}` - Get student details
- `POST /students/` - Create new student record
- `PUT /students/{student_id}` - Update student
- `DELETE /students/{student_id}` - Delete student

### Predictions
- `POST /students/predict` - Predict failure for student
- `GET /students/{student_id}/prediction` - Get prediction history

### Dashboard
- `GET /dashboard/stats` - Dashboard statistics
- `GET /dashboard/risk-analysis` - Risk analysis data

### Upload
- `POST /upload/` - Bulk upload student data (CSV)

## 🧠 ML Models

The system uses:
- **Classifier**: Trained on student performance data
- **Explainer**: SHAP (SHapley Additive exPlanations) for model interpretability
- **Feature Encoders**: Label encoders for categorical features

## 🗄️ Database Schema

### Students Table
- `id` - Primary key
- `name` - Student name
- `email` - Email address
- `student_id` - Unique identifier
- `performance_metrics` - JSON with grades, attendance, etc.
- `predicted_failure_risk` - Probability score (0-1)
- `created_at` - Record creation timestamp
- `updated_at` - Last update timestamp

## 🔐 Authentication

Uses JWT (JSON Web Tokens):
1. User registers/logs in
2. Server returns JWT token
3. Frontend stores token (localStorage/sessionStorage)
4. Include token in Authorization header: `Bearer {token}`
5. Backend validates token on protected routes

## 📊 Data Flow

```
Student Data (CSV)
    ↓
[Upload Endpoint]
    ↓
[Database]
    ↓
[ML Predictor]
    ↓
[Risk Scores + Explanations]
    ↓
[Dashboard Display]
```

## 🛠️ Development Workflow

1. **Backend changes**: Edit files in `Backend/`, restart server with `--reload`
2. **Frontend changes**: Edit files in `frontend/src/`, changes auto-refresh
3. **ML changes**: Update notebooks in `ml_pipeline/`, retrain and export models




