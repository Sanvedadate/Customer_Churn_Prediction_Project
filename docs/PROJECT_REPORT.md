# Customer Churn Prediction Using Data Mining
### Project name: **ChurnIQ**

---

## Abstract

Customer churn — the loss of subscribers to a competitor or to cancellation — is the single largest
controllable revenue leak for telecom operators. This mini project applies a complete data mining
workflow (CRISP-DM) to the **IBM Telco Customer Churn** dataset of 7,043 subscribers in order to
predict which customers are about to leave and to explain *why*.

Three classic classification algorithms — Logistic Regression, Decision Tree and Random Forest — were
trained on a stratified 80/20 split with identical preprocessing. The Random Forest achieved the best
result with **F1 = 0.6300**, **ROC-AUC = 0.8450**, **recall = 0.7968** and **accuracy = 0.7516** on the
held-out test set of 1,409 customers. The trained pipeline is deployed twice: as a FastAPI REST service
and as an in-browser inference engine powering the **ChurnIQ** React analytics dashboard.

---

## 1. Introduction

### 1.1 Problem statement
Acquiring a new telecom customer costs roughly five times more than retaining an existing one. Operators
therefore need a system that flags at-risk customers early enough for a retention offer to work.

### 1.2 Objectives
1. Acquire and clean a real, publicly available churn dataset.
2. Explore the data and identify the behavioural and contractual drivers of churn.
3. Build, tune and compare at least three data mining classification models.
4. Evaluate them with accuracy, precision, recall, F1 and ROC-AUC.
5. Deploy the best model in a usable application with live prediction.
6. Translate model output into concrete retention recommendations.

### 1.3 Scope
The project covers the full pipeline from raw CSV to a deployed, interactive web application, plus a
reproducible Jupyter notebook, an automated test suite and this report.

---

## 2. Literature / background

| Technique | Why it is used here |
|---|---|
| **Logistic Regression** | Linear baseline; coefficients are directly interpretable as log-odds of churn. |
| **Decision Tree** | Produces human-readable if-then rules; useful to explain churn logic to business teams. |
| **Random Forest** | Bagged ensemble of trees; reduces variance, handles non-linear interactions, gives feature importance. |
| **One-Hot Encoding** | Converts 16 nominal attributes into a numeric design matrix without imposing a false ordering. |
| **Standardisation** | Puts `tenure`, `MonthlyCharges` and `TotalCharges` on a common scale so the linear model converges. |
| **Balanced class weights** | Counteracts the 73.5 / 26.5 class imbalance, protecting recall on the minority (churn) class. |

---

## 3. Dataset

| Property | Value |
|---|---|
| Source | IBM Sample Data Sets — Telco Customer Churn |
| File | `WA_Fn-UseC_-Telco-Customer-Churn.csv` |
| Rows | 7,043 |
| Columns | 21 (19 predictors + `customerID` + target `Churn`) |
| Target balance | 5,174 retained (73.46 %) / 1,869 churned (26.54 %) |
| Duplicate rows | 0 |
| Missing values | 11 blank `TotalCharges` cells (all with `tenure = 0`) |

### 3.1 Attribute groups
* **Demographic:** `gender`, `SeniorCitizen`, `Partner`, `Dependents`
* **Account:** `tenure`, `Contract`, `PaperlessBilling`, `PaymentMethod`, `MonthlyCharges`, `TotalCharges`
* **Services:** `PhoneService`, `MultipleLines`, `InternetService`, `OnlineSecurity`, `OnlineBackup`,
  `DeviceProtection`, `TechSupport`, `StreamingTV`, `StreamingMovies`

### 3.2 Descriptive statistics

| Metric | Value |
|---|---|
| Average tenure | 32.37 months |
| Average monthly charges | \$64.76 |
| Average total charges | \$2,283.30 |
| Overall churn rate | 26.54 % |

---

## 4. Data preprocessing

1. **Type repair** — `TotalCharges` is stored as text; coerced with `pd.to_numeric(errors="coerce")`.
2. **Missing-value imputation** — the 11 resulting NaNs (brand-new customers) are filled with
   `tenure × MonthlyCharges`, which equals 0 and is the semantically correct value.
3. **Identifier removal** — `customerID` is dropped; it carries no predictive signal and would leak identity.
4. **Target encoding** — `Churn` mapped `Yes → 1`, `No → 0`.
5. **Numeric scaling** — `StandardScaler` on `tenure`, `MonthlyCharges`, `TotalCharges`, `SeniorCitizen`.
6. **Categorical encoding** — `OneHotEncoder(handle_unknown="ignore")` on the 16 nominal attributes,
   expanding the design matrix to 45 features.
7. **Splitting** — stratified 80/20 train/test split (5,634 / 1,409 rows), `random_state=42`.

All steps live inside a scikit-learn `ColumnTransformer` + `Pipeline`, guaranteeing that training and
inference apply byte-identical transformations and eliminating train/serve skew.

---

## 5. Exploratory data analysis

### 5.1 Churn by contract type

| Contract | Customers | Churned | Churn rate |
|---|---|---|---|
| Month-to-month | 3,875 | 1,655 | **42.71 %** |
| One year | 1,473 | 166 | 11.27 % |
| Two year | 1,695 | 48 | **2.83 %** |

Contract length is the single strongest churn signal: month-to-month customers churn 15× more often
than two-year contract holders.

### 5.2 Other findings
* **Internet service** — fiber-optic subscribers churn at roughly 42 %, versus ~19 % for DSL and ~7 %
  for customers with no internet product, suggesting a price/quality perception problem in the fiber tier.
* **Payment method** — electronic-check payers churn at ~45 %, far above automatic bank transfer or
  credit card (~15 %).
* **Support add-ons** — customers without `TechSupport` or `OnlineSecurity` churn at more than twice the
  rate of customers who have them.
* **Tenure** — churn is concentrated in the first 12 months and falls steadily afterwards.

Figures: `docs/visualizations/eda_overview.png`, `eda_categories.png`, `eda_numeric.png`, `correlation.png`.

---

## 6. Modelling

| Model | Key hyper-parameters |
|---|---|
| Logistic Regression | `max_iter=2000`, `class_weight="balanced"` |
| Decision Tree | `max_depth=6`, `min_samples_leaf=25`, `class_weight="balanced"` |
| Random Forest | `n_estimators=300`, `max_depth=12`, `min_samples_leaf=8`, `class_weight="balanced"` |

Each model is wrapped in the shared preprocessing pipeline and trained on the same 5,634-row training set.

---

## 7. Results and evaluation

### 7.1 Test-set metrics (1,409 held-out customers)

| Model | Accuracy | Precision | Recall | F1 | ROC-AUC |
|---|---|---|---|---|---|
| **Random Forest** (best) | **0.7516** | **0.5210** | **0.7968** | **0.6300** | **0.8450** |
| Decision Tree | 0.7402 | 0.5068 | 0.7941 | 0.6188 | 0.8343 |
| Logistic Regression | 0.7381 | 0.5043 | 0.7834 | 0.6136 | 0.8413 |

### 7.2 Confusion matrices

| Model | TN | FP | FN | TP |
|---|---|---|---|---|
| Random Forest | 761 | 274 | 76 | 298 |
| Decision Tree | 746 | 289 | 77 | 297 |
| Logistic Regression | 747 | 288 | 81 | 293 |

The Random Forest catches 298 of the 374 real churners (79.7 % recall) while missing only 76. Because the
cost of a missed churner (lost lifetime value) exceeds the cost of a false alarm (a discount offer to a
loyal customer), the balanced-weight configuration that maximises recall and F1 is the correct business
trade-off — even though a plain accuracy-optimised model would score higher on raw accuracy.

### 7.3 Top churn drivers (Random Forest importance)

| Rank | Feature | Importance |
|---|---|---|
| 1 | Contract = Month-to-month | 0.163 |
| 2 | tenure | 0.119 |
| 3 | Contract = Two year | 0.087 |
| 4 | OnlineSecurity = No | 0.083 |
| 5 | TotalCharges | 0.074 |
| 6 | TechSupport = No | 0.068 |
| 7 | InternetService = Fiber optic | 0.067 |
| 8 | PaymentMethod = Electronic check | 0.048 |
| 9 | MonthlyCharges | 0.040 |

Figures: `docs/visualizations/roc_curves.png`, `confusion_random_forest.png`, `feature_importance_rf.png`.

---

## 8. System design and deployment

```
                +-------------------------+
   CSV (IBM) -> |  train.py               | -> models/*.pkl, model_results.csv
                |  clean -> encode -> fit |    feature_importance.csv
                +-------------------------+    churn_results.json
                              |
              +---------------+-----------------+
              v                                 v
   +----------------------+          +--------------------------+
   | FastAPI (backend)    |          | ChurnIQ React dashboard  |
   | /predict /models     |          | Dashboard, Predict,      |
   | /stats /health       |          | Analytics, Models,       |
   | joblib pipelines     |          | Dataset, Methodology     |
   +----------------------+          +--------------------------+
```

* **Backend** — `backend/app.py`, FastAPI + Pydantic validation, loads the joblib pipelines and exposes
  `/health`, `/models`, `/stats`, `/feature-importance`, `/predict`, `/predict/batch`, with OpenAPI docs at `/docs`.
* **Frontend** — React 19 + TypeScript + Tailwind + Recharts. The trained Random Forest, Decision Tree and
  Logistic Regression pipelines are exported to JSON (`src/data/model_export.json`) and re-implemented in
  `src/lib/churn-model.ts`, so the dashboard scores customers instantly in the browser with **no backend
  required**. Parity against scikit-learn was verified: the maximum absolute probability difference across
  all three models on sample customers is **< 5e-6**.

---

## 9. Testing

`tests/test_pipeline.py` (pytest, 10 tests, all passing) verifies:
dataset shape and target rate, the 11 malformed `TotalCharges` values, model loading and probability
bounds for all three models, monotonic behaviour (a high-risk profile must score above a low-risk one),
metric-file integrity, sorted and normalised feature importance, and the FastAPI `/health` and `/predict`
endpoints via `TestClient`.

---

## 10. Limitations and future work

* The dataset is a static snapshot — no time-series of usage, complaints or network quality.
* Precision (~0.52) is limited by class imbalance; a cost-sensitive threshold or a calibrated
  probability cut-off tuned to the actual retention-offer margin would improve campaign ROI.
* Future work: gradient boosting (XGBoost/LightGBM), SHAP explanations per customer, survival analysis
  for *time-to-churn*, and automated retraining on fresh monthly extracts.

---

## 11. Conclusion

A complete data mining pipeline was implemented end-to-end on 7,043 real telecom records. The Random
Forest classifier identifies about 80 % of churners with a ROC-AUC of 0.845 and clearly attributes churn
to short contracts, low tenure, fiber-optic service, electronic-check billing and missing support add-ons.
The recommended retention playbook follows directly: incentivise annual contracts, bundle tech support and
online security, push automatic payment methods, and run a structured onboarding programme through the
first year of tenure.

---

## References

1. IBM Sample Data Sets — *Telco Customer Churn*.
2. Pedregosa, F. et al. (2011). *Scikit-learn: Machine Learning in Python*. JMLR 12, 2825–2830.
3. Breiman, L. (2001). *Random Forests*. Machine Learning 45(1), 5–32.
4. Chapman, P. et al. (2000). *CRISP-DM 1.0: Step-by-step data mining guide*.
5. Han, J., Kamber, M., Pei, J. (2011). *Data Mining: Concepts and Techniques*, 3rd ed.
