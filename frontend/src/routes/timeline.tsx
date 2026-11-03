import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/timeline")({
  head: () => ({
    meta: [
      { title: "Project Timeline — ChurnIQ" },
      {
        name: "description",
        content:
          "Development phases of the ChurnIQ mini project, from team building and requirement analysis through ML development, testing, documentation and demo.",
      },
      { property: "og:title", content: "Project Timeline — ChurnIQ" },
      { property: "og:description", content: "Sixteen delivery milestones of the Customer Churn Prediction mini project." },
    ],
  }),
  component: TimelinePage,
});

const stages = [
  ["Team Building", "Roles split across data engineering, ML modelling, frontend and documentation."],
  ["Problem Statement", "Framed churn as a supervised binary classification problem with a retention objective."],
  ["Requirement Analysis", "Listed functional needs: dataset explorer, analytics, model comparison, live prediction."],
  ["Tools Selection", "Python, pandas, scikit-learn, joblib, FastAPI, React, TypeScript, Tailwind CSS, shadcn/ui, Recharts."],
  ["Dataset Collection", "Downloaded the public IBM Telco Customer Churn CSV directly from its official repository."],
  ["UI/UX Wireframes", "Sketched the sidebar shell, KPI grid, chart grid and prediction console."],
  ["Frontend Design", "Built a dark analytics design system with semantic tokens and reusable chart components."],
  ["Backend Development", "Implemented a FastAPI service exposing summary, dataset, analytics, model and prediction endpoints."],
  ["ML Development", "Trained Logistic Regression, Decision Tree and Random Forest inside one leakage-free pipeline."],
  ["Database / File Handling", "Persisted CSV, serialized models (.pkl), model_results.csv and feature_importance.csv."],
  ["Integration", "Wired the trained pipeline into both the API and the dashboard's prediction console."],
  ["Testing & Debugging", "Ran pytest suites for data loading, preprocessing, models, API endpoints and invalid input."],
  ["Documentation", "Wrote the README, API reference and reproducible run instructions."],
  ["Final Report", "Compiled docs/PROJECT_REPORT.md with real metrics and comparative analysis."],
  ["Presentation", "Generated a 15-slide deck with actual results."],
  ["Demo", "Walked the dashboard, dataset explorer, model comparison and live churn scoring."],
] as const;

function TimelinePage() {
  return (
    <AppLayout title="Project Timeline" description="Development phases of the ChurnIQ mini project">
      <div className="grid gap-4 md:grid-cols-2">
        {stages.map(([title, body], i) => (
          <Card key={title} className="surface-card border-border">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardDescription>Step {i + 1}</CardDescription>
                <CardTitle className="text-base">{title}</CardTitle>
              </div>
              <Badge variant="secondary" className="shrink-0">
                <CheckCircle2 className="mr-1 size-3" /> Done
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
