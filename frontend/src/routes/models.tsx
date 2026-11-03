import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { ChartCard, HorizontalImportance, MetricComparison, RocChart } from "@/components/ChurnCharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { results } from "@/lib/churn-data";

export const Route = createFileRoute("/models")({
  head: () => ({
    meta: [
      { title: "Model Comparison — ChurnIQ" },
      {
        name: "description",
        content:
          "Accuracy, precision, recall, F1 and ROC-AUC for Logistic Regression, Decision Tree and Random Forest trained on IBM Telco churn data.",
      },
      { property: "og:title", content: "Model Comparison — ChurnIQ" },
      { property: "og:description", content: "Confusion matrices, ROC curves and feature importance for three classifiers." },
    ],
  }),
  component: ModelsPage,
});

function ModelsPage() {
  const rows = [...results.modelResults].sort((a, b) => b.f1 - a.f1);
  const cms = results.confusionMatrices;

  return (
    <AppLayout title="Models" description="Training, evaluation and comparative analysis">
      <div className="space-y-6">
        <Card className="surface-card border-border">
          <CardHeader>
            <CardTitle>Comparison table</CardTitle>
            <CardDescription>
              Hold-out test set: {results.dataset.test_rows.toLocaleString()} rows (stratified 80/20 split). Best model
              chosen by F1 score.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Accuracy</TableHead>
                  <TableHead>Precision</TableHead>
                  <TableHead>Recall</TableHead>
                  <TableHead>F1</TableHead>
                  <TableHead>ROC-AUC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.model}>
                    <TableCell className="font-medium">
                      {r.model}{" "}
                      {r.model === results.bestModel ? (
                        <Badge className="ml-2" variant="secondary">
                          Best
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell>{r.accuracy.toFixed(4)}</TableCell>
                    <TableCell>{r.precision.toFixed(4)}</TableCell>
                    <TableCell>{r.recall.toFixed(4)}</TableCell>
                    <TableCell>{r.f1.toFixed(4)}</TableCell>
                    <TableCell>{r.roc_auc.toFixed(4)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          <ChartCard title="Accuracy comparison">
            <MetricComparison data={rows} metric="accuracy" label="Accuracy" />
          </ChartCard>
          <ChartCard title="Precision comparison">
            <MetricComparison data={rows} metric="precision" label="Precision" />
          </ChartCard>
          <ChartCard title="Recall comparison">
            <MetricComparison data={rows} metric="recall" label="Recall" />
          </ChartCard>
          <ChartCard title="F1 comparison">
            <MetricComparison data={rows} metric="f1" label="F1" />
          </ChartCard>
          <ChartCard title="ROC-AUC comparison">
            <MetricComparison data={rows} metric="roc_auc" label="ROC-AUC" />
          </ChartCard>
          <ChartCard title="ROC curves" description="True vs false positive rate on the test set">
            <RocChart curves={results.rocCurves} />
          </ChartCard>
          <ChartCard title="Random Forest — Top 15 feature importance" description="feature_importances_">
            <HorizontalImportance data={[...results.featureImportanceRF].reverse()} />
          </ChartCard>
          <ChartCard title="Logistic Regression — Top 15 |coefficients|" description="Coefficient magnitude">
            <HorizontalImportance
              data={[...results.featureImportanceLR]
                .map((f) => ({ feature: f.feature, value: f.lr_abs_coefficient }))
                .reverse()}
            />
          </ChartCard>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(cms).map(([name, cm]) => (
            <Card key={name} className="surface-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Confusion matrix — {name}</CardTitle>
                <CardDescription>Rows: actual · Columns: predicted</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-border text-center text-sm">
                  <div className="bg-card p-3" />
                  <div className="bg-card p-3 font-medium">Pred No</div>
                  <div className="bg-card p-3 font-medium">Pred Yes</div>
                  <div className="bg-card p-3 font-medium">Actual No</div>
                  <div className="bg-secondary p-3">{cm.tn}</div>
                  <div className="bg-secondary p-3">{cm.fp}</div>
                  <div className="bg-card p-3 font-medium">Actual Yes</div>
                  <div className="bg-secondary p-3">{cm.fn}</div>
                  <div className="bg-secondary p-3">{cm.tp}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
