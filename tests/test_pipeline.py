"""Tests for the ChurnIQ data mining pipeline and API layer.

Run from the project root:
    pytest -q
"""

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import pytest

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "WA_Fn-UseC_-Telco-Customer-Churn.csv"
MODELS = ROOT / "models"

SAMPLE = {
    "gender": "Female",
    "SeniorCitizen": 0,
    "Partner": "No",
    "Dependents": "No",
    "tenure": 2,
    "PhoneService": "Yes",
    "MultipleLines": "No",
    "InternetService": "Fiber optic",
    "OnlineSecurity": "No",
    "OnlineBackup": "No",
    "DeviceProtection": "No",
    "TechSupport": "No",
    "StreamingTV": "No",
    "StreamingMovies": "No",
    "Contract": "Month-to-month",
    "PaperlessBilling": "Yes",
    "PaymentMethod": "Electronic check",
    "MonthlyCharges": 85.5,
    "TotalCharges": 171.0,
}


@pytest.fixture(scope="module")
def raw() -> pd.DataFrame:
    return pd.read_csv(DATA)


def test_dataset_shape(raw: pd.DataFrame) -> None:
    assert raw.shape == (7043, 21)
    assert "Churn" in raw.columns


def test_total_charges_cleaning(raw: pd.DataFrame) -> None:
    cleaned = pd.to_numeric(raw["TotalCharges"], errors="coerce")
    # 11 blank strings exist in the original IBM file
    assert cleaned.isna().sum() == 11
    assert cleaned.dropna().min() >= 0


def test_target_distribution(raw: pd.DataFrame) -> None:
    rate = (raw["Churn"] == "Yes").mean()
    assert 0.26 < rate < 0.27


@pytest.mark.parametrize("name", ["logistic_regression", "decision_tree", "random_forest"])
def test_models_load_and_predict(name: str) -> None:
    pipeline = joblib.load(MODELS / f"{name}.pkl")
    proba = pipeline.predict_proba(pd.DataFrame([SAMPLE]))[:, 1]
    assert proba.shape == (1,)
    assert 0.0 <= float(proba[0]) <= 1.0


def test_high_risk_profile_scores_above_low_risk_profile() -> None:
    pipeline = joblib.load(MODELS / "random_forest.pkl")
    low = dict(SAMPLE, Contract="Two year", tenure=70, TotalCharges=6000, InternetService="DSL",
               PaymentMethod="Credit card (automatic)", TechSupport="Yes", OnlineSecurity="Yes")
    probs = pipeline.predict_proba(pd.DataFrame([SAMPLE, low]))[:, 1]
    assert probs[0] > probs[1]


def test_metrics_file_is_consistent() -> None:
    results = pd.read_csv(MODELS / "model_results.csv")
    assert {"model", "accuracy", "precision", "recall", "f1", "roc_auc"} <= set(results.columns)
    assert len(results) == 3
    assert results[["accuracy", "f1", "roc_auc"]].to_numpy().min() > 0.4
    assert results["roc_auc"].max() > 0.8


def test_feature_importance_sorted() -> None:
    fi = pd.read_csv(MODELS / "feature_importance.csv")
    values = fi["rf_importance"].to_numpy()
    assert np.all(np.diff(values) <= 1e-12)
    assert abs(values.sum() - 1.0) < 0.05


def test_api_predict_endpoint() -> None:
    fastapi_testclient = pytest.importorskip("fastapi.testclient")
    import sys

    sys.path.insert(0, str(ROOT))
    from backend.app import app  # noqa: WPS433

    client = fastapi_testclient.TestClient(app)
    assert client.get("/health").json()["status"] == "ok"
    res = client.post("/predict", json={"customer": SAMPLE, "model": "random_forest"})
    assert res.status_code == 200
    body = res.json()
    assert 0.0 <= body["churn_probability"] <= 1.0
    assert body["prediction"] in {"Churn", "Retain"}
    assert body["risk_band"] in {"Low", "Medium", "High"}
