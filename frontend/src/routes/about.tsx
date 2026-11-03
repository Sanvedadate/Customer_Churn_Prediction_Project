import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { results } from "@/lib/churn-data";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About ChurnIQ — Data Mining Mini Project" },
      {
        name: "description",
        content:
          "About the ChurnIQ mini project: objective, dataset source, technology stack, architecture, API endpoints, limitations and future scope.",
      },
      { property: "og:title", content: "About ChurnIQ — Data Mining Mini Project" },
      { property: "og:description", content: "Customer Churn Prediction Using Data Mining — project overview and stack." },
    ],
  }),
  component: AboutPage,
});

const endpoints = [
  ["GET /api/health", "Service and model load status"],
  ["GET /api/summary", "Dataset KPIs (customers, churn rate, averages)"],
  ["GET /api/dataset", "Schema, dtypes, missing values, sample records"],
  ["GET /api/analytics", "Segment-level churn breakdowns"],
  ["GET /api/model-results", "Metrics for all three models"],
  ["GET /api/feature-importance", "RF importances and LR coefficients"],
  ["GET /api/confusion-matrices", "TN / FP / FN / TP per model"],
  ["GET /api/roc-data", "ROC curve points per model"],
  ["POST /api/predict", "Score a customer with the trained pipeline"],
];

function AboutPage() {
  const best = results.modelResults.find((m) => m.model === results.bestModel);
  return (
    <AppLayout title="About" description="Customer Churn Prediction Using Data Mining">
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="surface-card border-border">
          <CardHeader>
            <CardTitle>Project overview</CardTitle>
            <CardDescription>ChurnIQ — Customer Churn Prediction & Analytics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              ChurnIQ is a data mining mini project that predicts whether a telecom customer will churn. It covers the
              full pipeline: dataset acquisition, cleaning, exploratory analysis, encoding, model training, evaluation,
              comparative analysis and an interactive prediction console.
            </p>
            <p>
              Every number in this dashboard is computed from the real IBM Telco Customer Churn dataset
              ({results.dataset.rows.toLocaleString()} rows × {results.dataset.columns} columns) and from actual model
              execution — nothing is simulated.
            </p>
          </CardContent>
        </Card>

        <Card className="surface-card border-border">
          <CardHeader>
            <CardTitle>Best model</CardTitle>
            <CardDescription>Selected primarily by F1 score</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-2xl font-semibold">{results.bestModel}</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Accuracy {best?.accuracy.toFixed(4)}</Badge>
              <Badge variant="secondary">Precision {best?.precision.toFixed(4)}</Badge>
              <Badge variant="secondary">Recall {best?.recall.toFixed(4)}</Badge>
              <Badge variant="secondary">F1 {best?.f1.toFixed(4)}</Badge>
              <Badge variant="secondary">ROC-AUC {best?.roc_auc.toFixed(4)}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-card border-border">
          <CardHeader>
            <CardTitle>Technology stack</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {[
              "Python",
              "pandas",
              "NumPy",
              "scikit-learn",
              "joblib",
              "FastAPI",
              "Jupyter",
              "React",
              "TypeScript",
              "Tailwind CSS",
              "shadcn/ui",
              "Recharts",
            ].map((t) => (
              <Badge key={t} variant="outline">
                {t}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card className="surface-card border-border">
          <CardHeader>
            <CardTitle>Dataset source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>IBM Telco Customer Churn — WA_Fn-UseC_-Telco-Customer-Churn.csv</p>
            <p className="break-all">
              https://github.com/IBM/telco-customer-churn-on-icp4d/blob/master/data/Telco-Customer-Churn.csv
            </p>
          </CardContent>
        </Card>

        <Card className="surface-card border-border xl:col-span-2">
          <CardHeader>
            <CardTitle>Backend API</CardTitle>
            <CardDescription>FastAPI service bundled in the project ZIP (backend/app.py)</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {endpoints.map(([path, desc]) => (
              <div key={path} className="rounded-lg border border-border p-3 text-sm">
                <p className="font-mono text-xs text-primary">{path}</p>
                <p className="text-muted-foreground">{desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="surface-card border-border">
          <CardHeader>
            <CardTitle>Limitations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>· Static snapshot of 7,043 customers — no live behavioural or usage signals.</p>
            <p>· Class imbalance (26.5% churn) caps precision at the 0.50 threshold.</p>
            <p>· No hyperparameter search beyond sensible regularisation defaults.</p>
          </CardContent>
        </Card>

        <Card className="surface-card border-border">
          <CardHeader>
            <CardTitle>Future scope</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>· Gradient boosting (XGBoost / LightGBM) and threshold tuning by expected revenue.</p>
            <p>· SHAP explanations per customer and retention-offer recommendations.</p>
            <p>· Batch scoring pipeline and CRM integration.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
