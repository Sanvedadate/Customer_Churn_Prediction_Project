import json, numpy as np, joblib, os
R = "models"
out = {}
lr = joblib.load(f"{R}/logistic_regression.pkl")
dt = joblib.load(f"{R}/decision_tree.pkl")
rf = joblib.load(f"{R}/random_forest.pkl")
pre = lr.named_steps["pre"]
num_cols = list(pre.transformers_[0][2]); cat_cols = list(pre.transformers_[1][2])
num_imp = pre.named_transformers_["num"].named_steps["imp"]
sc = pre.named_transformers_["num"].named_steps["sc"]
oh = pre.named_transformers_["cat"].named_steps["oh"]
out["pre"] = {
    "numCols": num_cols,
    "numMedians": [float(x) for x in num_imp.statistics_],
    "numMean": [float(x) for x in sc.mean_],
    "numScale": [float(x) for x in sc.scale_],
    "catCols": cat_cols,
    "catCategories": [[str(c) for c in cats] for cats in oh.categories_],
    "featureNames": [f.split("__", 1)[1] for f in pre.get_feature_names_out()],
}
out["logistic"] = {"coef": [round(float(c), 6) for c in lr.named_steps["clf"].coef_[0]],
                   "intercept": float(lr.named_steps["clf"].intercept_[0])}

def tree_json(t):
    tr = t.tree_
    val = tr.value[:, 0, :]
    prob = (val[:, 1] / val.sum(axis=1)).round(5)
    return {"l": tr.children_left.tolist(), "r": tr.children_right.tolist(),
            "f": tr.feature.tolist(), "t": [round(float(x), 6) for x in tr.threshold],
            "p": [float(x) for x in prob]}

out["decisionTree"] = tree_json(dt.named_steps["clf"])
out["randomForest"] = [tree_json(e) for e in rf.named_steps["clf"].estimators_]
s = json.dumps(out, separators=(",", ":"))
print("size KB", len(s) / 1024)
out_dir = "frontend/src/data"
os.makedirs(out_dir, exist_ok=True)
open(f"{out_dir}/model_export.json", "w").write(s)
