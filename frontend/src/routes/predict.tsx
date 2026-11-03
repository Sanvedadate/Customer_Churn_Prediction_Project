import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Gauge, ShieldCheck, Sparkles } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  categoryOptions,
  modelNames,
  predict,
  type ChurnInput,
  type ModelName,
} from "@/lib/churn-model";
import { results } from "@/lib/churn-data";

export const Route = createFileRoute("/predict")({
  head: () => ({
    meta: [
      { title: "Predict Churn — ChurnIQ" },
      {
        name: "description",
        content:
          "Score a telecom customer with the trained Random Forest, Logistic Regression or Decision Tree model and get churn probability and risk level.",
      },
      { property: "og:title", content: "Predict Churn — ChurnIQ" },
      {
        property: "og:description",
        content: "Enter customer attributes and get an instant churn prediction with probability and risk band.",
      },
    ],
  }),
  component: PredictPage,
});

const defaults: ChurnInput = {
  gender: "Female",
  SeniorCitizen: 0,
  Partner: "Yes",
  Dependents: "No",
  tenure: 12,
  PhoneService: "Yes",
  MultipleLines: "No",
  InternetService: "Fiber optic",
  OnlineSecurity: "No",
  OnlineBackup: "No",
  DeviceProtection: "No",
  TechSupport: "No",
  StreamingTV: "Yes",
  StreamingMovies: "Yes",
  Contract: "Month-to-month",
  PaperlessBilling: "Yes",
  PaymentMethod: "Electronic check",
  MonthlyCharges: 85.5,
  TotalCharges: 1026,
};

const categoricalFields: { key: keyof ChurnInput; label: string }[] = [
  { key: "gender", label: "Gender" },
  { key: "Partner", label: "Partner" },
  { key: "Dependents", label: "Dependents" },
  { key: "PhoneService", label: "Phone Service" },
  { key: "MultipleLines", label: "Multiple Lines" },
  { key: "InternetService", label: "Internet Service" },
  { key: "OnlineSecurity", label: "Online Security" },
  { key: "OnlineBackup", label: "Online Backup" },
  { key: "DeviceProtection", label: "Device Protection" },
  { key: "TechSupport", label: "Tech Support" },
  { key: "StreamingTV", label: "Streaming TV" },
  { key: "StreamingMovies", label: "Streaming Movies" },
  { key: "Contract", label: "Contract" },
  { key: "PaperlessBilling", label: "Paperless Billing" },
  { key: "PaymentMethod", label: "Payment Method" },
];

const riskStyles: Record<string, string> = {
  "Low Risk": "text-success",
  "Medium Risk": "text-warning",
  "High Risk": "text-destructive",
};

function PredictPage() {
  const [form, setForm] = useState<ChurnInput>(defaults);
  const [model, setModel] = useState<ModelName>("Random Forest");
  const [output, setOutput] = useState<ReturnType<typeof predict> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof ChurnInput, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onPredict = () => {
    try {
      if (
        !Number.isFinite(Number(form.tenure)) ||
        !Number.isFinite(Number(form.MonthlyCharges)) ||
        !Number.isFinite(Number(form.TotalCharges))
      ) {
        setError("Tenure, monthly charges and total charges must be valid numbers.");
        setOutput(null);
        return;
      }
      if (Number(form.tenure) < 0 || Number(form.MonthlyCharges) < 0 || Number(form.TotalCharges) < 0) {
        setError("Numeric values cannot be negative.");
        setOutput(null);
        return;
      }
      setError(null);
      setOutput(
        predict(
          {
            ...form,
            tenure: Number(form.tenure),
            MonthlyCharges: Number(form.MonthlyCharges),
            TotalCharges: Number(form.TotalCharges),
            SeniorCitizen: Number(form.SeniorCitizen),
          },
          model,
        ),
      );
    } catch (e) {
      setError("Prediction failed. Please check your inputs.");
      console.error(e);
    }
  };

  const probability = output ? output.probability * 100 : 0;

  return (
    <AppLayout title="Predict Churn" description="Score a customer with the trained models">
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card className="surface-card border-border">
          <CardHeader>
            <CardTitle>Customer attributes</CardTitle>
            <CardDescription>
              customerID is intentionally excluded — it carries no predictive signal.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="senior">Senior Citizen</Label>
              <Select value={String(form.SeniorCitizen)} onValueChange={(v) => set("SeniorCitizen", Number(v))}>
                <SelectTrigger id="senior">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No</SelectItem>
                  <SelectItem value="1">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {categoricalFields.map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{label}</Label>
                <Select value={String(form[key])} onValueChange={(v) => set(key, v)}>
                  <SelectTrigger id={key}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(categoryOptions[key] ?? []).map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}

            <div className="space-y-2">
              <Label htmlFor="tenure">Tenure (months)</Label>
              <Input
                id="tenure"
                type="number"
                min={0}
                value={form.tenure}
                onChange={(e) => set("tenure", e.target.value === "" ? 0 : Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly">Monthly Charges ($)</Label>
              <Input
                id="monthly"
                type="number"
                step="0.05"
                min={0}
                value={form.MonthlyCharges}
                onChange={(e) => set("MonthlyCharges", e.target.value === "" ? 0 : Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total">Total Charges ($)</Label>
              <Input
                id="total"
                type="number"
                step="0.05"
                min={0}
                value={form.TotalCharges}
                onChange={(e) => set("TotalCharges", e.target.value === "" ? 0 : Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select value={model} onValueChange={(v) => setModel(v as ModelName)}>
                <SelectTrigger id="model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modelNames.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                      {m === results.bestModel ? " (best)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <Button size="lg" className="w-full" onClick={onPredict}>
                <Sparkles className="mr-2 size-4" /> PREDICT CHURN
              </Button>
              {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
            </div>
          </CardContent>
        </Card>

        <Card className="surface-card border-border">
          <CardHeader>
            <CardTitle>Prediction result</CardTitle>
            <CardDescription>Computed by the trained {model} pipeline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {!output ? (
              <p className="text-sm text-muted-foreground">
                Fill in the customer profile and press <strong>PREDICT CHURN</strong> to score the customer.
              </p>
            ) : (
              <>
                <div className="rounded-xl border border-border bg-secondary/40 p-5 text-center">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Prediction</p>
                  <p
                    className={`mt-1 text-4xl font-bold ${
                      output.prediction === "CHURN" ? "text-destructive" : "text-success"
                    }`}
                  >
                    {output.prediction}
                  </p>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Churn probability</span>
                    <span className="font-semibold">{probability.toFixed(1)}%</span>
                  </div>
                  <Progress value={probability} />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border p-4">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    {output.risk === "High Risk" ? (
                      <AlertTriangle className="size-4" />
                    ) : output.risk === "Medium Risk" ? (
                      <Gauge className="size-4" />
                    ) : (
                      <ShieldCheck className="size-4" />
                    )}
                    Risk level
                  </span>
                  <span className={`text-lg font-semibold ${riskStyles[output.risk]}`}>{output.risk}</span>
                </div>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>0–30% Low Risk · 31–60% Medium Risk · 61–100% High Risk</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Model: {output.model}</Badge>
                    <Badge variant="outline">Threshold: 0.50</Badge>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
