import { Info } from "lucide-react";
import type { Charge } from "@/types/api";
import { formatUSD } from "@/lib/geo";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function FareBreakdown({ fare, charges, total }: { fare: number; charges?: Charge[] | undefined; total: number }) {
  // Total always comes from the API; rows are never summed here.
  const combined = Math.round((total - fare) * 100) / 100;
  return (
    <div>
      <h3 className="text-caption text-muted-foreground">Fare breakdown</h3>
      <TooltipProvider delayDuration={150}>
        <dl className="mt-2 space-y-2 text-small">
          <Row label="Base fare" value={fare} />
          {charges
            ? charges.map((c, i) => <Row key={`${c.label}-${i}`} label={c.label} value={c.amount} info={c.description} />)
            : combined !== 0 && <Row label="Taxes & surcharges (combined)" value={combined} />}
        </dl>
      </TooltipProvider>
      <div className="mt-3 flex items-baseline justify-between border-t pt-3 text-[20px] leading-7 font-bold">
        <span>Total</span>
        <span className="tabular-nums">{formatUSD(total)}</span>
      </div>
    </div>
  );
}

function Row({ label, value, info }: { label: string; value: number; info?: string | undefined }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="flex items-center gap-1.5 text-muted-foreground">
        {label}
        {info && (
          <Tooltip>
            <TooltipTrigger type="button" className="rounded-full text-muted-foreground" aria-label={`About ${label}`}>
              <Info className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent className="max-w-60">{info}</TooltipContent>
          </Tooltip>
        )}
      </dt>
      <dd className="tabular-nums text-foreground">{formatUSD(value)}</dd>
    </div>
  );
}
