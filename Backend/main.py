from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
import auth, upload, students, dashboard
from ml_predictor import load_model

# create all DB tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FAILSAFE API",
    description="Student failure prediction system with Explainable AI",
    version="1.0.0"
)

# allow React frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    load_model()


@app.get("/")
def root():
    return {"message": "FAILSAFE API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


# register all routers
app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(students.router)
app.include_router(dashboard.router)
