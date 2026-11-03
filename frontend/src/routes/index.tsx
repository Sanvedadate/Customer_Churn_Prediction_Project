import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "ChurnIQ — Customer Churn Prediction & Analytics" },
      {
        name: "description",
        content:
          "ChurnIQ predicts telecom customer churn using data mining on the IBM Telco dataset, with dashboards, model comparison and live scoring.",
      },
      { property: "og:title", content: "ChurnIQ — Customer Churn Prediction & Analytics" },
      {
        property: "og:description",
        content: "Data mining mini project: churn analytics, three trained classifiers and an interactive prediction console.",
      },
    ],
  }),
  component: () => null,
});
