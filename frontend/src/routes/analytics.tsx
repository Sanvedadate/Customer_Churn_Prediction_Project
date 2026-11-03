import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { ChartCard, ChurnRateBar, StackedCounts } from "@/components/ChurnCharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { results } from "@/lib/churn-data";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Exploratory Analytics — ChurnIQ" },
      {
        name: "description",
        content:
          "Exploratory data analysis of the IBM Telco churn dataset: churn drivers by contract, services, billing, tenure and demographics.",
      },
      { property: "og:title", content: "Exploratory Analytics — ChurnIQ" },
      { property: "og:description", content: "Segment-level churn rates and descriptive statistics from the real dataset." },
    ],
  }),
  component: AnalyticsPage,
});

const groups: { key: string; title: string; description: string }[] = [
  { key: "Contract", title: "Contract type", description: "Churn rate by contract length" },
  { key: "InternetService", title: "Internet service", description: "Churn rate by internet product" },
  { key: "PaymentMethod", title: "Payment method", description: "Churn rate by billing channel" },
  { key: "TechSupport", title: "Tech support", description: "Churn rate by support subscription" },
  { key: "OnlineSecurity", title: "Online security", description: "Churn rate by security add-on" },
  { key: "PaperlessBilling", title: "Paperless billing", description: "Churn rate by billing preference" },
  { key: "Partner", title: "Partner", description: "Churn rate by partner status" },
  { key: "Dependents", title: "Dependents", description: "Churn rate by dependents" },
  { key: "gender", title: "Gender", description: "Churn rate by gender" },
];

function AnalyticsPage() {
  const a = results.analytics;
  const desc = results.describe;
  const statRows = ["count", "mean", "std", "min", "25%", "50%", "75%", "max"];

  return (
    <AppLayout title="Analytics" description="Exploratory data analysis on 7,043 real customer records">
      <div className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-2">
          <ChartCard title="Churn by tenure band" description="Retained vs churned per tenure bucket">
            <StackedCounts data={a["TenureBand"] ?? []} />
          </ChartCard>
          <ChartCard title="Churn by monthly charge band" description="Retained vs churned per charge bucket">
            <StackedCounts data={a["ChargeBand"] ?? []} />
          </ChartCard>
          {groups.map((g) => (
            <ChartCard key={g.key} title={g.title} description={g.description}>
              <ChurnRateBar data={a[g.key] ?? []} />
            </ChartCard>
          ))}
        </div>

        <Card className="surface-card border-border">
          <CardHeader>
            <CardTitle>Descriptive statistics</CardTitle>
            <CardDescription>Numeric features (TotalCharges after numeric coercion)</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Statistic</TableHead>
                  {Object.keys(desc).map((c) => (
                    <TableHead key={c}>{c}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {statRows.map((stat) => (
                  <TableRow key={stat}>
                    <TableCell className="font-medium">{stat}</TableCell>
                    {Object.keys(desc).map((c) => (
                      <TableCell key={c}>{desc[c]?.[stat] ?? "—"}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
