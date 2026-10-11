import type { LucideIcon } from "lucide-react";

export function StatTile({ icon: Icon, label, value, unit }: { icon: LucideIcon; label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-lg border bg-secondary p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground">
          <Icon className="size-4" aria-hidden />
        </span>
        <span className="text-caption">{label}</span>
      </div>
      <p className="mt-3 text-stat">
        {value}
        {unit && <span className="ml-1 text-h3 font-semibold text-muted-foreground">{unit}</span>}
      </p>
    </div>
  );
}
