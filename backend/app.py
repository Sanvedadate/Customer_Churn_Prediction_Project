"""ChurnIQ FastAPI backend.

Serves the trained scikit-learn pipelines (Logistic Regression, Decision Tree,
Random Forest) for real-time churn scoring.

Run:
    uvicorn backend.app:app --reload --port 8000
Docs:
    http://localhost:8000/docs
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parents[1]
MODELS_DIR = ROOT / "models"
DATA_CSV = ROOT / "data" / "WA_Fn-UseC_-Telco-Customer-Churn.csv"
RESULTS_JSON = ROOT / "docs" / "churn_results.json"

MODEL_FILES = {
    "logistic_regression": "logistic_regression.pkl",
    "decision_tree": "decision_tree.pkl",
    "random_forest": "random_forest.pkl",
}

app = FastAPI(
    title="ChurnIQ API",
    description="Customer Churn Prediction Using Data Mining — IBM Telco dataset",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_cache: Dict[str, Any] = {}


def load_model(name: str):
    if name not in MODEL_FILES:
        raise HTTPException(status_code=400, detail=f"Unknown model '{name}'")
    if name not in _cache:
        path = MODELS_DIR / MODEL_FILES[name]
        if not path.exists():
            raise HTTPException(status_code=503, detail=f"Model file missing: {path.name}. Run train.py first.")
        _cache[name] = joblib.load(path)
    return _cache[name]


class Customer(BaseModel):
    gender: Literal["Male", "Female"] = "Female"
    SeniorCitizen: int = Field(0, ge=0, le=1)
    Partner: Literal["Yes", "No"] = "No"
    Dependents: Literal["Yes", "No"] = "No"
    tenure: float = Field(12, ge=0)
    PhoneService: Literal["Yes", "No"] = "Yes"
    MultipleLines: Literal["Yes", "No", "No phone service"] = "No"
    InternetService: Literal["DSL", "Fiber optic", "No"] = "Fiber optic"
    OnlineSecurity: Literal["Yes", "No", "No internet service"] = "No"
    OnlineBackup: Literal["Yes", "No", "No internet service"] = "No"
    DeviceProtection: Literal["Yes", "No", "No internet service"] = "No"
    TechSupport: Literal["Yes", "No", "No internet service"] = "No"
    StreamingTV: Literal["Yes", "No", "No internet service"] = "No"
    StreamingMovies: Literal["Yes", "No", "No internet service"] = "No"
    Contract: Literal["Month-to-month", "One year", "Two year"] = "Month-to-month"
    PaperlessBilling: Literal["Yes", "No"] = "Yes"
    PaymentMethod: Literal[
        "Electronic check",
        "Mailed check",
        "Bank transfer (automatic)",
        "Credit card (automatic)",
    ] = "Electronic check"
    MonthlyCharges: float = Field(85.5, ge=0)
    TotalCharges: Optional[float] = Field(1026.0, ge=0)


class PredictRequest(BaseModel):
    customer: Customer
    model: Literal["logistic_regression", "decision_tree", "random_forest"] = "random_forest"
    threshold: float = Field(0.5, ge=0.0, le=1.0)


class PredictResponse(BaseModel):
    model: str
    churn_probability: float
    prediction: Literal["Churn", "Retain"]
    risk_band: Literal["Low", "Medium", "High"]
    threshold: float


class BatchRequest(BaseModel):
    customers: List[Customer]
    model: Literal["logistic_regression", "decision_tree", "random_forest"] = "random_forest"
    threshold: float = Field(0.5, ge=0.0, le=1.0)


def risk_band(p: float) -> str:
    if p >= 0.66:
        return "High"
    if p >= 0.33:
        return "Medium"
    return "Low"


def score(customers: List[Customer], model_name: str, threshold: float) -> List[PredictResponse]:
    pipeline = load_model(model_name)
    frame = pd.DataFrame([c.model_dump() for c in customers])
    probs = pipeline.predict_proba(frame)[:, 1]
    return [
        PredictResponse(
            model=model_name,
            churn_probability=round(float(p), 6),
            prediction="Churn" if p >= threshold else "Retain",
            risk_band=risk_band(float(p)),
            threshold=threshold,
        )
        for p in probs
    ]


@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "models_available": [n for n, f in MODEL_FILES.items() if (MODELS_DIR / f).exists()],
        "dataset_present": DATA_CSV.exists(),
    }


@app.get("/models")
def models() -> Dict[str, Any]:
    csv_path = MODELS_DIR / "model_results.csv"
    if not csv_path.exists():
        raise HTTPException(status_code=503, detail="model_results.csv missing. Run train.py first.")
    return {"models": pd.read_csv(csv_path).to_dict("records")}


@app.get("/stats")
def stats() -> Dict[str, Any]:
    if RESULTS_JSON.exists():
        return json.loads(RESULTS_JSON.read_text())
    raise HTTPException(status_code=503, detail="churn_results.json missing. Run train.py first.")


@app.get("/feature-importance")
def feature_importance(top: int = 15) -> Dict[str, Any]:
    csv_path = MODELS_DIR / "feature_importance.csv"
    if not csv_path.exists():
        raise HTTPException(status_code=503, detail="feature_importance.csv missing. Run train.py first.")
    df = pd.read_csv(csv_path).head(top)
    return {"features": df.to_dict("records")}


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest) -> PredictResponse:
    return score([req.customer], req.model, req.threshold)[0]


@app.post("/predict/batch", response_model=List[PredictResponse])
def predict_batch(req: BatchRequest) -> List[PredictResponse]:
    if not req.customers:
        raise HTTPException(status_code=400, detail="customers list is empty")
    return score(req.customers, req.model, req.threshold)
