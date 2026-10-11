import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CarTaxiFront } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { healthQuery } from "@/features/predict/queries";

export function Header() {
  const health = useQuery(healthQuery);
  const online = health.data?.status === "ok";
  return (
    <header className="sticky top-0 z-[1100] border-b bg-card">
      <div className="taxi-stripe h-1" aria-hidden />
      <div className="flex h-14 items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <CarTaxiFront className="size-5" aria-hidden />
          </span>
          <span className="hidden sm:inline">NYC Taxi Predictor</span>
        </Link>
        <nav className="ml-2 flex items-center gap-1 text-small" aria-label="Main">
          {([["/", "Predict"], ["/about", "About the model"]] as const).map(([to, label]) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: true }}
              className="rounded-md px-2.5 py-1.5 text-muted-foreground transition-colors ease-ui hover:bg-muted"
              activeProps={{ className: "bg-primary-soft font-semibold text-foreground" }}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto">
          {health.isPending ? (
            <Badge variant="secondary">Checking API…</Badge>
          ) : online ? (
            <Badge variant="success"><span className="size-2 rounded-full bg-success" aria-hidden />API online</Badge>
          ) : (
            <Badge variant="secondary"><span className="size-2 rounded-full bg-muted-foreground" aria-hidden />Demo data</Badge>
          )}
        </div>
      </div>
      {health.isError && (
        <div role="status" className="border-t bg-muted px-4 py-1.5 text-center text-small text-muted-foreground">
          Prediction service is offline — showing demo data.
        </div>
      )}
    </header>
  );
}
