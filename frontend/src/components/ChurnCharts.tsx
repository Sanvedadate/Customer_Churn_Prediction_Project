import React from "react";
import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { chartColors, type CategoryStat } from "@/lib/churn-data";

const axis = { stroke: "var(--color-muted-foreground)", fontSize: 12 };
const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: "0.6rem",
  color: "var(--color-popover-foreground)",
};

const ChartSizeContext = React.createContext({ width: 0, height: 304 });

function useChartSize() {
  return React.useContext(ChartSizeContext);
}

export function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="surface-card border-border">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="h-80">
        <AutoSize>{children}</AutoSize>
      </CardContent>
    </Card>
  );
}

function AutoSize({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(400); // Default width

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry?.contentRect.width ?? 400;
      setWidth(w > 0 ? w : 400);
    });
    ro.observe(el);
    const initialWidth = el.getBoundingClientRect().width;
    if (initialWidth > 0) setWidth(initialWidth);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="h-full w-full">
      <ChartSizeContext.Provider value={{ width, height: 304 }}>{children}</ChartSizeContext.Provider>
    </div>
  );
}

export function ChurnRateBar({ data }: { data: CategoryStat[] }) {
  return (
    <BarChart {...useChartSize()} data={data} margin={{ left: -12, right: 8, top: 8 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
      <XAxis dataKey="category" tick={axis} interval={0} angle={-12} textAnchor="end" height={54} />
      <YAxis tick={axis} unit="%" />
      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} cursor={{ fill: "var(--color-muted)" }} />
      <Bar dataKey="churnRate" name="Churn rate" radius={[6, 6, 0, 0]}>
        {data.map((_, i) => (
          <Cell key={i} fill={chartColors[i % chartColors.length]} />
        ))}
      </Bar>
    </BarChart>
  );
}

export function StackedCounts({ data }: { data: CategoryStat[] }) {
  return (
    <BarChart {...useChartSize()} data={data} margin={{ left: -12, right: 8, top: 8 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
      <XAxis dataKey="category" tick={axis} interval={0} angle={-12} textAnchor="end" height={54} />
      <YAxis tick={axis} />
      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-muted)" }} />
      <Legend wrapperStyle={{ fontSize: 12 }} />
      <Bar dataKey="retained" stackId="a" name="Retained" fill="var(--color-chart-3)" radius={[0, 0, 0, 0]} />
      <Bar dataKey="churned" stackId="a" name="Churned" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
    </BarChart>
  );
}

export function ChurnPie({ churned, active }: { churned: number; active: number }) {
  const data = [
    { name: "Churned", value: churned },
    { name: "Retained", value: active },
  ];
  return (
    <PieChart {...useChartSize()}>
      <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={100} paddingAngle={3}>
        <Cell fill="var(--color-chart-2)" />
        <Cell fill="var(--color-chart-1)" />
      </Pie>
      <Tooltip contentStyle={tooltipStyle} />
      <Legend wrapperStyle={{ fontSize: 12 }} />
    </PieChart>
  );
}

export function RocChart({
  curves,
}: {
  curves: Record<string, { fpr: number; tpr: number }[]>;
}) {
  const names = Object.keys(curves);
  const merged = (curves[names[0] as string] ?? []).map((_, i) => {
    const point: Record<string, number> = { idx: i / 99 };
    names.forEach((n) => {
      point[n] = curves[n]?.[i]?.tpr ?? 0;
      point[`${n}_fpr`] = curves[n]?.[i]?.fpr ?? 0;
    });
    return point;
  });
  return (
    <LineChart {...useChartSize()} data={merged} margin={{ left: -14, right: 10, top: 8 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
      <XAxis
        dataKey={`${names[0]}_fpr`}
        type="number"
        domain={[0, 1]}
        tick={axis}
        label={{ value: "False positive rate", position: "insideBottom", offset: -2, fill: "var(--color-muted-foreground)", fontSize: 11 }}
      />
      <YAxis tick={axis} domain={[0, 1]} />
      <Tooltip contentStyle={tooltipStyle} />
      <Legend wrapperStyle={{ fontSize: 12 }} />
      {names.map((n, i) => (
        <Line key={n} type="monotone" dataKey={n} dot={false} strokeWidth={2} stroke={chartColors[i % chartColors.length]} />
      ))}
    </LineChart>
  );
}

export function HorizontalImportance({ data }: { data: { feature: string; value: number }[] }) {
  return (
    <BarChart {...useChartSize()} data={data} layout="vertical" margin={{ left: 90, right: 16 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
      <XAxis type="number" tick={axis} />
      <YAxis type="category" dataKey="feature" tick={{ ...axis, fontSize: 11 }} width={140} />
      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-muted)" }} />
      <Bar dataKey="value" fill="var(--color-chart-1)" radius={[0, 6, 6, 0]} />
    </BarChart>
  );
}

export function MetricComparison({
  data,
  metric,
  label,
}: {
  data: { model: string; [k: string]: number | string }[];
  metric: string;
  label: string;
}) {
  return (
    <BarChart {...useChartSize()} data={data} margin={{ left: -14, right: 8, top: 8 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
      <XAxis dataKey="model" tick={{ ...axis, fontSize: 11 }} />
      <YAxis tick={axis} domain={[0, 1]} />
      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-muted)" }} />
      <Bar dataKey={metric} name={label} radius={[6, 6, 0, 0]}>
        {data.map((_, i) => (
          <Cell key={i} fill={chartColors[i % chartColors.length]} />
        ))}
      </Bar>
    </BarChart>
  );
}
