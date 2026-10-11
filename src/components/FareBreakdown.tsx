import type { Charge } from "@/types/api";
import { formatUSD } from "@/lib/geo";

export function FareBreakdown({ fare, charges, total }: { fare: number; charges?: Charge[] | undefined; total: number }) {
  return (
    <div>
      <h3 className="text-caption text-muted-foreground">Fare breakdown</h3>
      <dl className="mt-2 divide-y text-small">
        <Row label="Base fare" value={fare} />
        {charges?.map((c, i) => <Row key={`${c.label}-${i}`} label={c.label} value={c.amount} />)}
        <div className="flex justify-between py-2.5 text-base font-bold">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatUSD(total)}</dd>
        </div>
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{formatUSD(value)}</dd>
    </div>
  );
}
