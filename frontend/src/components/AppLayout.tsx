import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  BrainCircuit,
  Database,
  GitBranch,
  Info,
  LayoutDashboard,
  Menu,
  Workflow,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/predict", label: "Predict Churn", icon: BrainCircuit },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/models", label: "Models", icon: Activity },
  { to: "/dataset", label: "Dataset", icon: Database },
  { to: "/data-mining", label: "Data Mining", icon: Workflow },
  { to: "/timeline", label: "Timeline", icon: GitBranch },
  { to: "/about", label: "About", icon: Info },
] as const;

export function AppLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <aside
        className={cn(
          "z-40 border-r border-sidebar-border bg-sidebar lg:sticky lg:top-0 lg:block lg:h-screen",
          open ? "block" : "hidden",
        )}
      >
        <div className="flex h-full flex-col p-4">
          <Link to="/dashboard" className="mb-8 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <BrainCircuit className="size-5" />
            </span>
            <span>
              <span className="block text-lg font-semibold tracking-tight">ChurnIQ</span>
              <span className="block text-xs text-muted-foreground">Churn Prediction & Analytics</span>
            </span>
          </Link>
          <nav className="flex flex-col gap-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <p className="mt-auto pt-6 text-xs text-muted-foreground">
            Data Mining Mini Project · IBM Telco Churn
          </p>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-border bg-background/80 px-5 py-4 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Toggle navigation"
            onClick={() => setOpen((v) => !v)}
          >
            <Menu className="size-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </header>
        <main className="flex-1 px-5 py-6">{children}</main>
      </div>
    </div>
  );
}
