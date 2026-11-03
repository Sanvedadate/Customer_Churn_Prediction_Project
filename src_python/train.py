import json, os, warnings, shutil
import numpy as np, pandas as pd, joblib
warnings.filterwarnings("ignore")
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (accuracy_score, precision_score, recall_score, f1_score,
                             roc_auc_score, confusion_matrix, roc_curve, classification_report)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = f"{ROOT}/data/WA_Fn-UseC_-Telco-Customer-Churn.csv"
os.makedirs(f"{ROOT}/models", exist_ok=True)
os.makedirs(f"{ROOT}/screenshots", exist_ok=True)
VIZ = f"{ROOT}/docs/visualizations"; os.makedirs(VIZ, exist_ok=True)

df = pd.read_csv(DATA)
info = {}
info["rows"], info["columns"] = int(df.shape[0]), int(df.shape[1])
info["column_names"] = list(df.columns)
info["dtypes_raw"] = {c: str(t) for c, t in df.dtypes.items()}
info["duplicate_rows"] = int(df.duplicated().sum())
info["duplicate_customer_ids"] = int(df["customerID"].duplicated().sum())
info["missing_raw"] = {c: int(v) for c, v in df.isna().sum().items()}
info["target_distribution"] = {k: int(v) for k, v in df["Churn"].value_counts().items()}

df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce")
info["total_charges_coerced_missing"] = int(df["TotalCharges"].isna().sum())
y = (df["Churn"] == "Yes").astype(int)
X = df.drop(columns=["customerID", "Churn"])

num_cols = ["tenure", "MonthlyCharges", "TotalCharges", "SeniorCitizen"]
cat_cols = [c for c in X.columns if c not in num_cols]
info["numeric_features"], info["categorical_features"] = num_cols, cat_cols
info["missing_after_coercion"] = {c: int(v) for c, v in X.isna().sum().items() if v}
info["dtypes_clean"] = {c: str(t) for c, t in X.dtypes.items()}

pre = ColumnTransformer([
    ("num", Pipeline([("imp", SimpleImputer(strategy="median")), ("sc", StandardScaler())]), num_cols),
    ("cat", Pipeline([("imp", SimpleImputer(strategy="most_frequent")),
                      ("oh", OneHotEncoder(handle_unknown="ignore"))]), cat_cols),
])

Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
info["train_rows"], info["test_rows"] = int(len(Xtr)), int(len(Xte))

models = {
    "Logistic Regression": LogisticRegression(max_iter=2000, class_weight="balanced"),
    "Decision Tree": DecisionTreeClassifier(max_depth=6, min_samples_leaf=20, random_state=42, class_weight="balanced"),
    "Random Forest": RandomForestClassifier(n_estimators=200, min_samples_leaf=25, max_depth=12, random_state=42, n_jobs=-1, class_weight="balanced_subset" if False else "balanced"),
}
slug = {"Logistic Regression": "logistic_regression", "Decision Tree": "decision_tree", "Random Forest": "random_forest"}

results, cms, rocs, fitted = [], {}, {}, {}
for name, clf in models.items():
    pipe = Pipeline([("pre", pre), ("clf", clf)])
    pipe.fit(Xtr, ytr)
    yp = pipe.predict(Xte); pr = pipe.predict_proba(Xte)[:, 1]
    results.append({"model": name,
                    "accuracy": accuracy_score(yte, yp), "precision": precision_score(yte, yp),
                    "recall": recall_score(yte, yp), "f1": f1_score(yte, yp),
                    "roc_auc": roc_auc_score(yte, pr)})
    cm = confusion_matrix(yte, yp)
    cms[name] = {"tn": int(cm[0, 0]), "fp": int(cm[0, 1]), "fn": int(cm[1, 0]), "tp": int(cm[1, 1])}
    fpr, tpr, _ = roc_curve(yte, pr)
    idx = np.linspace(0, len(fpr) - 1, 100).astype(int)
    rocs[name] = [{"fpr": round(float(fpr[i]), 4), "tpr": round(float(tpr[i]), 4)} for i in idx]
    fitted[name] = pipe
    joblib.dump(pipe, f"{ROOT}/models/{slug[name]}.pkl")
    print(name, "\n", classification_report(yte, yp))

res_df = pd.DataFrame(results).sort_values("f1", ascending=False)
res_df.to_csv(f"{ROOT}/models/model_results.csv", index=False)
best_name = res_df.iloc[0]["model"]
joblib.dump(fitted[best_name], f"{ROOT}/models/best_model.pkl")
joblib.dump(fitted[best_name].named_steps["pre"], f"{ROOT}/models/preprocessing_pipeline.pkl")

feat_names = list(fitted["Random Forest"].named_steps["pre"].get_feature_names_out())
clean = [f.split("__", 1)[1] for f in feat_names]
rf_imp = fitted["Random Forest"].named_steps["clf"].feature_importances_
lr_coef = fitted["Logistic Regression"].named_steps["clf"].coef_[0]
fi = pd.DataFrame({"feature": clean, "rf_importance": rf_imp,
                   "lr_coefficient": lr_coef, "lr_abs_coefficient": np.abs(lr_coef)})
fi.sort_values("rf_importance", ascending=False).to_csv(f"{ROOT}/models/feature_importance.csv", index=False)

# EDA / analytics from real data
d = df.copy(); d["ChurnFlag"] = y
def by(col):
    g = d.groupby(col)["ChurnFlag"].agg(["count", "sum"]).reset_index()
    return [{"category": str(r[col]), "total": int(r["count"]), "churned": int(r["sum"]),
             "retained": int(r["count"] - r["sum"]),
             "churnRate": round(float(r["sum"]) / float(r["count"]) * 100, 2)} for _, r in g.iterrows()]
tb = pd.cut(d["tenure"], [-1, 12, 24, 36, 48, 60, 100],
            labels=["0-12", "13-24", "25-36", "37-48", "49-60", "61-72"])
mb = pd.cut(d["MonthlyCharges"], [0, 35, 55, 75, 95, 200],
            labels=["<35", "35-55", "55-75", "75-95", "95+"])
d["TenureBand"], d["ChargeBand"] = tb, mb

analytics = {k: by(k) for k in ["Contract", "InternetService", "PaymentMethod", "TechSupport",
                                "OnlineSecurity", "gender", "PaperlessBilling", "Dependents",
                                "Partner", "TenureBand", "ChargeBand"]}
summary = {
    "totalCustomers": int(len(d)), "churned": int(d["ChurnFlag"].sum()),
    "active": int(len(d) - d["ChurnFlag"].sum()),
    "churnRate": round(float(d["ChurnFlag"].mean()) * 100, 2),
    "avgMonthlyCharges": round(float(d["MonthlyCharges"].mean()), 2),
    "avgTenure": round(float(d["tenure"].mean()), 2),
    "avgTotalCharges": round(float(d["TotalCharges"].mean()), 2),
}
desc = df[["tenure", "MonthlyCharges", "TotalCharges"]].describe().round(2).to_dict()

bundle = {
    "dataset": info, "summary": summary, "analytics": analytics,
    "describe": desc,
    "modelResults": [{k: (round(v, 4) if isinstance(v, float) else v) for k, v in r.items()} for r in results],
    "bestModel": best_name,
    "confusionMatrices": cms, "rocCurves": rocs,
    "featureImportanceRF": fi.sort_values("rf_importance", ascending=False).head(15)[["feature", "rf_importance"]]
        .rename(columns={"rf_importance": "value"}).round(5).to_dict("records"),
    "featureImportanceLR": fi.sort_values("lr_abs_coefficient", ascending=False).head(15)[["feature", "lr_coefficient", "lr_abs_coefficient"]]
        .round(4).to_dict("records"),
}
os.makedirs(f"{ROOT}/docs", exist_ok=True)
json.dump(bundle, open(f"{ROOT}/docs/churn_results.json", "w"), indent=2)

# sample rows for dataset explorer
df.head(300).to_json(f"{ROOT}/docs/sample_rows.json", orient="records")

# Copy to frontend data directory
frontend_data_dir = f"{ROOT}/frontend/src/data"
os.makedirs(frontend_data_dir, exist_ok=True)
import shutil
shutil.copy(f"{ROOT}/docs/churn_results.json", f"{frontend_data_dir}/churn_results.json")
shutil.copy(f"{ROOT}/docs/sample_rows.json", f"{frontend_data_dir}/sample_rows.json")

# plots
def bar(names, vals, title, fname, color="#2563eb"):
    plt.figure(figsize=(6, 4)); plt.bar(names, vals, color=color)
    plt.title(title); plt.xticks(rotation=15); plt.tight_layout(); plt.savefig(f"{VIZ}/{fname}", dpi=120); plt.close()

for m in ["accuracy", "precision", "recall", "f1", "roc_auc"]:
    bar(res_df["model"], res_df[m], f"Model {m} comparison", f"comparison_{m}.png")
for name, cm in cms.items():
    arr = np.array([[cm["tn"], cm["fp"]], [cm["fn"], cm["tp"]]])
    plt.figure(figsize=(4, 4)); plt.imshow(arr, cmap="Blues")
    for i in range(2):
        for j in range(2):
            plt.text(j, i, arr[i, j], ha="center", va="center")
    plt.title(f"Confusion Matrix — {name}"); plt.xlabel("Predicted"); plt.ylabel("Actual")
    plt.xticks([0, 1], ["No", "Yes"]); plt.yticks([0, 1], ["No", "Yes"])
    plt.tight_layout(); plt.savefig(f"{VIZ}/confusion_{slug[name]}.png", dpi=120); plt.close()
plt.figure(figsize=(5, 5))
for name in rocs:
    xs = [p["fpr"] for p in rocs[name]]; ys = [p["tpr"] for p in rocs[name]]
    plt.plot(xs, ys, label=name)
plt.plot([0, 1], [0, 1], "k--"); plt.legend(); plt.title("ROC Curves")
plt.xlabel("FPR"); plt.ylabel("TPR"); plt.tight_layout(); plt.savefig(f"{VIZ}/roc_curves.png", dpi=120); plt.close()
top = fi.sort_values("rf_importance", ascending=False).head(15)[::-1]
plt.figure(figsize=(7, 6)); plt.barh(top["feature"], top["rf_importance"], color="#0e7490")
plt.title("Random Forest — Top 15 Feature Importance"); plt.tight_layout()
plt.savefig(f"{VIZ}/feature_importance_rf.png", dpi=120); plt.close()

print(res_df.to_string(index=False)); print("BEST:", best_name)
