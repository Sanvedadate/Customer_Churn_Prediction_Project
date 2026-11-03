import modelExport from "@/data/model_export.json";

type TreeJSON = { l: number[]; r: number[]; f: number[]; t: number[]; p: number[] };

type Export = {
  pre: {
    numCols: string[];
    numMedians: number[];
    numMean: number[];
    numScale: number[];
    catCols: string[];
    catCategories: string[][];
    featureNames: string[];
  };
  logistic: { coef: number[]; intercept: number };
  decisionTree: TreeJSON;
  randomForest: TreeJSON[];
};

const M = modelExport as unknown as Export;

export type ChurnInput = {
  gender: string;
  SeniorCitizen: number;
  Partner: string;
  Dependents: string;
  tenure: number;
  PhoneService: string;
  MultipleLines: string;
  InternetService: string;
  OnlineSecurity: string;
  OnlineBackup: string;
  DeviceProtection: string;
  TechSupport: string;
  StreamingTV: string;
  StreamingMovies: string;
  Contract: string;
  PaperlessBilling: string;
  PaymentMethod: string;
  MonthlyCharges: number;
  TotalCharges: number;
};

/** Mirrors the fitted scikit-learn ColumnTransformer (median impute + standard scale + one-hot). */
export function transform(input: ChurnInput): number[] {
  const raw = input as unknown as Record<string, string | number>;
  const vec: number[] = [];

  M.pre.numCols.forEach((col, i) => {
    const v = Number(raw[col]);
    const filled = Number.isFinite(v) ? v : (M.pre.numMedians[i] ?? 0);
    vec.push((filled - (M.pre.numMean[i] ?? 0)) / (M.pre.numScale[i] ?? 1));
  });

  M.pre.catCols.forEach((col, i) => {
    const cats = M.pre.catCategories[i] ?? [];
    const value = String(raw[col]);
    cats.forEach((c) => vec.push(c === value ? 1 : 0));
  });

  return vec;
}

function treeProba(tree: TreeJSON, x: number[]): number {
  let node = 0;
  while ((tree.l[node] ?? -1) !== -1) {
    const feat = tree.f[node] ?? 0;
    const goLeft = (x[feat] ?? 0) <= (tree.t[node] ?? 0);
    node = (goLeft ? tree.l[node] : tree.r[node]) ?? 0;
  }
  return tree.p[node] ?? 0;
}

export const modelNames = ["Random Forest", "Logistic Regression", "Decision Tree"] as const;
export type ModelName = (typeof modelNames)[number];

export function predictProba(input: ChurnInput, model: ModelName = "Random Forest"): number {
  const x = transform(input);
  if (model === "Logistic Regression") {
    const z = M.logistic.coef.reduce((s, c, i) => s + c * (x[i] ?? 0), M.logistic.intercept);
    return 1 / (1 + Math.exp(-z));
  }
  if (model === "Decision Tree") return treeProba(M.decisionTree, x);
  const sum = M.randomForest.reduce((s, t) => s + treeProba(t, x), 0);
  return sum / M.randomForest.length;
}

export type RiskLevel = "Low Risk" | "Medium Risk" | "High Risk";

export function riskLevel(probability: number): RiskLevel {
  const p = probability * 100;
  if (p <= 30) return "Low Risk";
  if (p <= 60) return "Medium Risk";
  return "High Risk";
}

export function predict(input: ChurnInput, model: ModelName = "Random Forest") {
  const probability = predictProba(input, model);
  return {
    probability,
    prediction: probability >= 0.5 ? ("CHURN" as const) : ("NOT CHURN" as const),
    risk: riskLevel(probability),
    model,
  };
}

export const featureNames = M.pre.featureNames;
export const categoryOptions = Object.fromEntries(
  M.pre.catCols.map((c, i) => [c, M.pre.catCategories[i]]),
) as Record<string, string[]>;
