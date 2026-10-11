import { ArrowUpDown, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SwapButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className="size-9 rounded-full"
      onClick={onClick}
      disabled={disabled}
      aria-label="Swap pickup and dropoff"
      title="Swap pickup and dropoff"
    >
      <ArrowUpDown />
    </Button>
  );
}

export function DateTimePicker({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-caption text-muted-foreground">
        Trip date &amp; time <span className="normal-case tracking-normal">(New York)</span>
      </label>
      <input
        id={id}
        type="datetime-local"
        step={900}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-10 w-full rounded-md border border-input bg-card px-3 text-small shadow-sm disabled:opacity-50"
      />
    </div>
  );
}

export function PassengerStepper({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <span id="passengers-label" className="block text-caption text-muted-foreground">
        Passengers
      </span>
      <div role="group" aria-labelledby="passengers-label" className="flex h-10 items-center rounded-md border bg-card shadow-sm">
        <Button type="button" variant="ghost" size="icon" className="rounded-r-none" onClick={() => onChange(value - 1)} disabled={disabled || value <= 1} aria-label="Fewer passengers">
          <Minus />
        </Button>
        <output aria-live="polite" className="flex-1 text-center font-semibold tabular-nums">
          {value}
        </output>
        <Button type="button" variant="ghost" size="icon" className="rounded-l-none" onClick={() => onChange(value + 1)} disabled={disabled || value >= 6} aria-label="More passengers">
          <Plus />
        </Button>
      </div>
    </div>
  );
}

export function MapLegend() {
  return (
    <div className="rounded-lg border bg-card/95 px-3 py-2 text-small shadow-lg">
      <p className="text-caption text-muted-foreground">Legend</p>
      <ul className="mt-1 space-y-1">
        <li className="flex items-center gap-2"><span className="size-3 rounded-full bg-primary ring-2 ring-ink" aria-hidden /> Pickup</li>
        <li className="flex items-center gap-2"><span className="size-3 rounded-full bg-dropoff ring-2 ring-primary" aria-hidden /> Dropoff</li>
        <li className="flex items-center gap-2"><span className="h-1 w-4 rounded bg-primary ring-1 ring-ink" aria-hidden /> Route</li>
      </ul>
    </div>
  );
}
