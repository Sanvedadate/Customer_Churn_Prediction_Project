# ChurnIQ — Customer Churn Prediction Using Data Mining

A complete, working data mining mini project on the **IBM Telco Customer Churn** dataset
(7,043 customers, 21 attributes): data cleaning, EDA, three trained classifiers, evaluation,
a FastAPI service, an interactive React dashboard, a Jupyter notebook, a project report,
a slide deck and an automated test suite.

**Best model: Random Forest — Accuracy 0.7516 · Precision 0.5210 · Recall 0.7968 · F1 0.6300 · ROC-AUC 0.8450**

---

## 🚀 Quick Start

**Open in VS Code:**
1. Open this project folder in VS Code
2. The project will auto-start automatically
3. Dashboard opens at `http://localhost:8081`

**Manual Start:**
```bash
.\start.ps1
```

**Access Links:**
- Dashboard: `http://localhost:8081`
- API Docs: `http://localhost:8000/docs`

**Note:** Python 3.14 and Node.js 24.22 are installed on this system.

---

## 1. Folder structure

```
customer_churn_prediction_project/
├── data/                        IBM Telco churn CSV (7,043 rows)
├── notebooks/
│   └── customer_churn_analysis.ipynb   full executed workflow with outputs
├── models/                      trained joblib pipelines + metrics CSVs
│   ├── logistic_regression.pkl  decision_tree.pkl  random_forest.pkl
│   ├── best_model.pkl  preprocessing_pipeline.pkl
│   └── model_results.csv  feature_importance.csv
├── backend/
│   └── app.py                   FastAPI REST service
├── frontend/                    ChurnIQ React + TypeScript + Tailwind dashboard
├── src_python/
│   ├── train.py                 end-to-end training script
│   └── export_js.py             exports pipelines to JSON for browser inference
├── tests/test_pipeline.py       pytest suite (10 tests)
├── docs/
│   ├── PROJECT_REPORT.md        full academic report
│   ├── churn_results.json       all computed metrics & statistics
│   └── visualizations/          EDA, ROC, confusion matrix, feature importance PNGs
├── presentation/                PowerPoint deck (.pptx)
├── screenshots/                 dashboard screenshots
└── README.md
```

---

## 2. Quick start

### 2.1 Python side (training, API, tests)

```bash
# Install dependencies
pip install -r requirements.txt

# (Re)train all models from the raw CSV — writes models/ and docs/churn_results.json
python src_python/train.py

# Run the tests
pytest -q

# Start the REST API (docs at http://localhost:8000/docs)
uvicorn backend.app:app --reload --port 8000
```

Example request:

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"model":"random_forest","customer":{"tenure":2,"Contract":"Month-to-month",
       "InternetService":"Fiber optic","PaymentMethod":"Electronic check",
       "MonthlyCharges":85.5,"TotalCharges":171}}'
# -> {"model":"random_forest","churn_probability":0.83...,"prediction":"Churn","risk_band":"High","threshold":0.5}
```

| Endpoint | Method | Purpose |
|---|---|---|
| `/health` | GET | Service + model availability |
| `/models` | GET | Metrics for all three models |
| `/stats` | GET | Dataset summary and analytics |
| `/feature-importance?top=15` | GET | Ranked churn drivers |
| `/predict` | POST | Score a single customer |
| `/predict/batch` | POST | Score many customers |

### 2.2 Frontend (ChurnIQ dashboard)

```bash
cd frontend
npm run dev        # http://localhost:8081
```

The dashboard ships the trained models as JSON (`src/data/model_export.json`) and runs inference in
the browser via `src/lib/churn-model.ts`, so **no backend is required** to demo it. Browser predictions
were verified against scikit-learn: max absolute probability difference < 5e-6 for all three models.

Pages: **Dashboard** (KPIs + 10 charts) · **Predict Churn** (live scoring form) · **Analytics**
(segment deep-dive) · **Models** (metrics, ROC curves, feature importance) · **Dataset** (searchable
explorer) · **Data Mining** (CRISP-DM methodology) · **Timeline** · **About**.

### 2.3 Notebook

```bash
jupyter notebook notebooks/customer_churn_analysis.ipynb
```

The notebook is stored **with executed outputs**, so figures and metrics are visible without rerunning.

---

## 3. Workflow summary

1. **Data cleaning** — `TotalCharges` coerced to numeric (11 blanks filled with `tenure × MonthlyCharges`),
   `customerID` dropped, `Churn` encoded to 0/1.
2. **Preprocessing** — `StandardScaler` on 4 numeric columns + `OneHotEncoder` on 16 categorical columns
   inside a `ColumnTransformer` (45 features).
3. **Split** — stratified 80/20 (5,634 train / 1,409 test), `random_state=42`.
4. **Models** — Logistic Regression, Decision Tree (`max_depth=6`), Random Forest (300 trees, `max_depth=12`),
   all with `class_weight="balanced"`.
5. **Evaluation** — accuracy, precision, recall, F1, ROC-AUC, confusion matrices, 5-fold CV, ROC curves.
6. **Deployment** — joblib pipelines → FastAPI service and browser-side JSON model for the dashboard.

## 4. Key findings

* Month-to-month contracts churn at **42.7 %** vs **2.8 %** for two-year contracts.
* Electronic-check payers and fiber-optic subscribers are the highest-risk segments.
* Customers without tech support or online security churn at more than double the base rate.
* Churn is concentrated in the first 12 months of tenure.

**Recommended actions:** incentivise annual contracts, bundle tech support/online security,
migrate customers to automatic payments, and run a structured first-year onboarding programme.

---

## 5. Requirements

Python 3.10+ · pandas · numpy · scikit-learn · joblib · matplotlib · fastapi · uvicorn · pydantic · pytest
Node 18+ · React 19 · TypeScript · Tailwind CSS · Recharts

Dataset: IBM Sample Data Sets — Telco Customer Churn (`WA_Fn-UseC_-Telco-Customer-Churn.csv`).
