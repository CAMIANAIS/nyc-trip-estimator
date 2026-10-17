import { CheckCircle2, Clock, DollarSign, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/StatTile";
import { FareBreakdown } from "@/components/FareBreakdown";
import { formatDuration, formatUSD } from "@/lib/geo";
import type { PredictResponse } from "@/types/api";

export function ResultsCard({ result, onReset }: { result: PredictResponse; onReset: () => void }) {
  return (
    <section
      aria-labelledby="results-title"
      className="animate-in fade-in slide-in-from-bottom-2 rounded-lg border border-l-4 border-l-success bg-card p-6 shadow-md duration-300"
    >
      <div className="flex items-center gap-2">
        <CheckCircle2 className="size-5 text-success" aria-hidden />
        <h2 id="results-title" className="text-h3">Your estimate</h2>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
        <StatTile icon={DollarSign} label="Estimated total" value={formatUSD(result.total_amount)} />
        <StatTile icon={Clock} label="Estimated duration" value={formatDuration(result.trip_duration_min)} />
      </div>
      <p className="mt-4 text-small text-muted-foreground">
        <span className="tabular-nums">{result.trip_distance_miles.toFixed(1)} mi</span> · {result.pickup_zone.name} →{" "}
        {result.dropoff_zone.name}
      </p>
      <div className="mt-6">
        <FareBreakdown fare={result.fare_amount} charges={result.charges} total={result.total_amount} />
      </div>
      <p className="mt-4 text-small text-muted-foreground">
        Tip not included. Final fare may vary depending on applicable charges.
      </p>
      <Button variant="secondary" className="mt-5 w-full" onClick={onReset}>
        <RotateCcw /> New trip
      </Button>
    </section>
  );
}

export function ResultsSkeleton() {
  return (
    <div className="space-y-4 rounded-lg border bg-card p-6 shadow-md" aria-hidden>
      <Skeleton className="h-6 w-40 bg-muted" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 bg-muted" />
        <Skeleton className="h-24 bg-muted" />
      </div>
      <Skeleton className="h-4 w-3/4 bg-muted" />
      <Skeleton className="h-28 bg-muted" />
    </div>
  );
}
