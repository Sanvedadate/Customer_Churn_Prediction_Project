import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { results, sampleRows, type CustomerRow } from "@/lib/churn-data";

export const Route = createFileRoute("/dataset")({
  head: () => ({
    meta: [
      { title: "Dataset Explorer — ChurnIQ" },
      {
        name: "description",
        content:
          "Explore the IBM Telco Customer Churn dataset: 7,043 rows, 21 columns, data types, missing values and a searchable, sortable record table.",
      },
      { property: "og:title", content: "Dataset Explorer — ChurnIQ" },
      { property: "og:description", content: "Schema, quality checks and a paginated view of the real Telco churn records." },
    ],
  }),
  component: DatasetPage,
});

const PAGE_SIZE = 15;

function DatasetPage() {
  const d = results.dataset;
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string>("customerID");
  const [asc, setAsc] = useState(true);
  const [page, setPage] = useState(0);

  const columns = d.column_names;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? sampleRows.filter((r) =>
          Object.values(r).some((v) => String(v).toLowerCase().includes(q)),
        )
      : sampleRows;
    const sorted = [...base].sort((a: CustomerRow, b: CustomerRow) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") return asc ? av - bv : bv - av;
      return asc
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return sorted;
  }, [query, sortKey, asc]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const view = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  const toggleSort = (col: string) => {
    if (col === sortKey) setAsc((v) => !v);
    else {
      setSortKey(col);
      setAsc(true);
    }
    setPage(0);
  };

  return (
    <AppLayout title="Dataset Explorer" description="IBM Telco Customer Churn — WA_Fn-UseC_-Telco-Customer-Churn.csv">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Rows", value: d.rows.toLocaleString() },
            { label: "Columns", value: String(d.columns) },
            { label: "Duplicate rows", value: String(d.duplicate_rows) },
            {
              label: "Missing after coercion",
              value: `${d.total_charges_coerced_missing} (TotalCharges)`,
            },
          ].map((k) => (
            <Card key={k.label} className="surface-card border-border">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{k.label}</p>
                <p className="mt-1 text-2xl font-semibold">{k.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="surface-card border-border">
            <CardHeader>
              <CardTitle>Schema & data types</CardTitle>
              <CardDescription>Raw CSV dtypes and missing counts per column</CardDescription>
            </CardHeader>
            <CardContent className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Column</TableHead>
                    <TableHead>Dtype</TableHead>
                    <TableHead>Missing</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {columns.map((c) => (
                    <TableRow key={c}>
                      <TableCell className="font-medium">{c}</TableCell>
                      <TableCell>{d.dtypes_raw[c]}</TableCell>
                      <TableCell>{d.missing_raw[c] ?? 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="surface-card border-border">
            <CardHeader>
              <CardTitle>Target & feature split</CardTitle>
              <CardDescription>Churn distribution and modelling features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex flex-wrap gap-2">
                {Object.entries(d.target_distribution).map(([k, v]) => (
                  <Badge key={k} variant="secondary">
                    Churn = {k}: {v.toLocaleString()}
                  </Badge>
                ))}
                <Badge variant="outline">Train rows: {d.train_rows.toLocaleString()}</Badge>
                <Badge variant="outline">Test rows: {d.test_rows.toLocaleString()}</Badge>
              </div>
              <div>
                <p className="mb-1 font-medium">Numeric features</p>
                <p className="text-muted-foreground">{d.numeric_features.join(", ")}</p>
              </div>
              <div>
                <p className="mb-1 font-medium">Categorical features</p>
                <p className="text-muted-foreground">{d.categorical_features.join(", ")}</p>
              </div>
              <p className="text-muted-foreground">
                customerID is dropped before modelling; Churn is encoded as Yes = 1, No = 0.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="surface-card border-border">
          <CardHeader className="gap-3 sm:flex sm:items-center sm:justify-between">
            <div>
              <CardTitle>Records</CardTitle>
              <CardDescription>
                First 300 rows of the CSV, searchable and sortable ({filtered.length} matching)
              </CardDescription>
            </div>
            <Input
              placeholder="Search records…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              className="sm:max-w-xs"
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((c) => (
                      <TableHead key={c}>
                        <button
                          className="inline-flex items-center gap-1 whitespace-nowrap hover:text-foreground"
                          onClick={() => toggleSort(c)}
                        >
                          {c}
                          <ArrowUpDown className="size-3" />
                        </button>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {view.map((row, i) => (
                    <TableRow key={i}>
                      {columns.map((c) => (
                        <TableCell key={c} className="whitespace-nowrap">
                          {String(row[c] ?? "")}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Page {current + 1} of {pages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={current >= pages - 1}
                  onClick={() => setPage(current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
