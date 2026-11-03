import { createFileRoute } from "@tanstack/react-router";
import { Activity, DollarSign, TrendingDown, UserCheck, Users, Timer } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { ChartCard, ChurnPie, ChurnRateBar, StackedCounts } from "@/components/ChurnCharts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { results } from "@/lib/churn-data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "ChurnIQ Dashboard — Telco Churn Overview" },
      {
        name: "description",
        content:
          "Live dashboard of IBM Telco customer churn: churn rate, tenure, monthly charges and churn drivers across 7,043 customers.",
      },
      { property: "og:title", content: "ChurnIQ Dashboard — Telco Churn Overview" },
      {
        property: "og:description",
        content: "Churn KPIs and interactive charts built from the real IBM Telco Customer Churn dataset.",
      },
    ],
  }),
  component: DashboardPage,
});

function Kpi({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="surface-card border-border">
      <CardContent className="flex items-start justify-between gap-4 pt-6">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight overflow-hidden text-ellipsis">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  );
}

function DashboardPage() {
  const s = results.summary;
  const a = results.analytics;

  return (
    <AppLayout title="Dashboard" description="Customer Churn Prediction & Analytics — IBM Telco dataset">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Dataset: WA_Fn-UseC_-Telco-Customer-Churn.csv</Badge>
          <Badge variant="outline">
            {results.dataset.rows.toLocaleString()} rows · {results.dataset.columns} columns
          </Badge>
          <Badge variant="outline">Best model: {results.bestModel}</Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Kpi label="Total Customers" value={s.totalCustomers.toLocaleString()} hint="Records in dataset" icon={Users} />
          <Kpi label="Churned Customers" value={s.churned.toLocaleString()} hint="Churn = Yes" icon={TrendingDown} />
          <Kpi label="Active Customers" value={s.active.toLocaleString()} hint="Churn = No" icon={UserCheck} />
          <Kpi label="Churn Rate" value={`${s.churnRate}%`} hint="Share of churned customers" icon={Activity} />
          <Kpi label="Avg Monthly Charges" value={`$${s.avgMonthlyCharges}`} hint="Across all customers" icon={DollarSign} />
          <Kpi label="Avg Tenure" value={`${s.avgTenure} mo`} hint="Months with the operator" icon={Timer} />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <ChartCard title="Churn Distribution" description="Churned vs retained customers">
            <ChurnPie churned={s.churned} active={s.active} />
          </ChartCard>
          <ChartCard title="Churn by Contract" description="Churn rate per contract type">
            <ChurnRateBar data={a["Contract"] ?? []} />
          </ChartCard>
          <ChartCard title="Churn by Internet Service" description="Churn rate per internet product">
            <ChurnRateBar data={a["InternetService"] ?? []} />
          </ChartCard>
          <ChartCard title="Churn by Payment Method" description="Churn rate per payment method">
            <ChurnRateBar data={a["PaymentMethod"] ?? []} />
          </ChartCard>
          <ChartCard title="Churn by Tenure Band" description="Retained vs churned per tenure bucket (months)">
            <StackedCounts data={a["TenureBand"] ?? []} />
          </ChartCard>
          <ChartCard title="Churn by Monthly Charges" description="Retained vs churned per charge band ($)">
            <StackedCounts data={a["ChargeBand"] ?? []} />
          </ChartCard>
          <ChartCard title="Churn by Tech Support" description="Churn rate by tech support subscription">
            <ChurnRateBar data={a["TechSupport"] ?? []} />
          </ChartCard>
          <ChartCard title="Churn by Online Security" description="Churn rate by online security subscription">
            <ChurnRateBar data={a["OnlineSecurity"] ?? []} />
          </ChartCard>
        </div>
      </div>
    </AppLayout>
  );
}
