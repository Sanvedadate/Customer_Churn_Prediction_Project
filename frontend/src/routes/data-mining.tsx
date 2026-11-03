import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { results } from "@/lib/churn-data";

export const Route = createFileRoute("/data-mining")({
  head: () => ({
    meta: [
      { title: "Data Mining Methodology — ChurnIQ" },
      {
        name: "description",
        content:
          "Nine-phase data mining methodology behind ChurnIQ: problem identification, preprocessing, EDA, feature selection, classification, evaluation and conclusion.",
      },
      { property: "og:title", content: "Data Mining Methodology — ChurnIQ" },
      { property: "og:description", content: "How the churn prediction pipeline was designed, executed and validated." },
    ],
  }),
  component: MethodologyPage,
});

const best = results.modelResults.find((m) => m.model === results.bestModel);

const phases = [
  {
    phase: "Phase 1",
    title: "Problem Identification",
    body: "Telecom operators lose revenue when subscribers leave. The mining task is a binary classification problem: given a customer's demographics, subscribed services and billing behaviour, predict whether Churn = Yes.",
    tags: ["Binary classification", "Business goal: retention"],
  },
  {
    phase: "Phase 2",
    title: "Dataset Study",
    body: `The public IBM Telco Customer Churn dataset was loaded directly from its public repository: ${results.dataset.rows.toLocaleString()} records and ${results.dataset.columns} columns, with ${results.dataset.duplicate_rows} duplicate rows and ${results.dataset.target_distribution["Yes"]} churned customers (${results.summary.churnRate}%).`,
    tags: ["7,043 rows", "21 columns", "Class imbalance"],
  },
  {
    phase: "Phase 3",
    title: "Data Preprocessing",
    body: `TotalCharges arrives as an object dtype because ${results.dataset.total_charges_coerced_missing} rows contain blanks for brand-new customers; it is coerced to numeric and median-imputed. Categorical columns are mode-imputed and one-hot encoded, numeric columns standardised, and Churn encoded as Yes=1 / No=0. customerID is dropped.`,
    tags: ["Type correction", "Imputation", "One-hot encoding", "Scaling"],
  },
  {
    phase: "Phase 4",
    title: "Exploratory Data Analysis",
    body: "Univariate and bivariate analysis quantifies churn by contract, internet service, payment method, tenure band, monthly charge band, tech support and online security, exposing the strongest churn segments.",
    tags: ["Segment churn rates", "Distributions"],
  },
  {
    phase: "Phase 5",
    title: "Feature Selection",
    body: "All non-identifier attributes enter the pipeline; importance is then measured post-hoc with Random Forest impurity importance and Logistic Regression coefficient magnitude, and the top 15 features are reported.",
    tags: ["feature_importances_", "|coefficients|"],
  },
  {
    phase: "Phase 6",
    title: "Classification",
    body: "Three interpretable, widely used classifiers are trained inside a single scikit-learn Pipeline so that preprocessing is fitted on training data only: Logistic Regression, Decision Tree and Random Forest, all with balanced class weights.",
    tags: ["Logistic Regression", "Decision Tree", "Random Forest"],
  },
  {
    phase: "Phase 7",
    title: "Evaluation",
    body: `Models are scored on a stratified 20% hold-out set (${results.dataset.test_rows.toLocaleString()} customers) using accuracy, precision, recall, F1 and ROC-AUC, plus confusion matrices and ROC curves.`,
    tags: ["Stratified split", "5 metrics", "No leakage"],
  },
  {
    phase: "Phase 8",
    title: "Comparative Analysis",
    body: `Because churn detection cares about catching leavers, F1 is the primary selector. ${results.bestModel} wins with F1 = ${best?.f1.toFixed(4)} and ROC-AUC = ${best?.roc_auc.toFixed(4)}.`,
    tags: ["Primary metric: F1", `Winner: ${results.bestModel}`],
  },
  {
    phase: "Phase 9",
    title: "Conclusion & Deployment",
    body: "The winning pipeline is serialised with joblib, exposed through a FastAPI service and embedded in this dashboard, so a new customer profile can be scored instantly with a probability and a Low / Medium / High risk band.",
    tags: ["joblib", "FastAPI", "Interactive scoring"],
  },
];

function MethodologyPage() {
  return (
    <AppLayout title="Data Mining Methodology" description="The nine phases executed end to end in this project">
      <ol className="relative space-y-4 border-l border-border pl-6">
        {phases.map((p) => (
          <li key={p.phase} className="relative">
            <span className="absolute -left-[1.9rem] top-6 size-3 rounded-full bg-primary" />
            <Card className="surface-card border-border">
              <CardHeader>
                <CardDescription>{p.phase}</CardDescription>
                <CardTitle className="text-lg">{p.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{p.body}</p>
                <div className="flex flex-wrap gap-2">
                  {p.tags.map((t) => (
                    <Badge key={t} variant="secondary">
                      {t}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
    </AppLayout>
  );
}
