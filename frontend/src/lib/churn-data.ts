import bundle from "@/data/churn_results.json";
import rows from "@/data/sample_rows.json";

export type ModelResult = {
  model: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  roc_auc: number;
};

export type CategoryStat = {
  category: string;
  total: number;
  churned: number;
  retained: number;
  churnRate: number;
};

export type CustomerRow = Record<string, string | number>;

export const results = bundle as unknown as {
  dataset: {
    rows: number;
    columns: number;
    column_names: string[];
    dtypes_raw: Record<string, string>;
    dtypes_clean: Record<string, string>;
    duplicate_rows: number;
    duplicate_customer_ids: number;
    missing_raw: Record<string, number>;
    missing_after_coercion: Record<string, number>;
    total_charges_coerced_missing: number;
    target_distribution: Record<string, number>;
    numeric_features: string[];
    categorical_features: string[];
    train_rows: number;
    test_rows: number;
  };
  summary: {
    totalCustomers: number;
    churned: number;
    active: number;
    churnRate: number;
    avgMonthlyCharges: number;
    avgTenure: number;
    avgTotalCharges: number;
  };
  analytics: Record<string, CategoryStat[]>;
  describe: Record<string, Record<string, number>>;
  modelResults: ModelResult[];
  bestModel: string;
  confusionMatrices: Record<string, { tn: number; fp: number; fn: number; tp: number }>;
  rocCurves: Record<string, { fpr: number; tpr: number }[]>;
  featureImportanceRF: { feature: string; value: number }[];
  featureImportanceLR: { feature: string; lr_coefficient: number; lr_abs_coefficient: number }[];
};

export const sampleRows = rows as unknown as CustomerRow[];

export const pct = (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`;

export const chartColors = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];
