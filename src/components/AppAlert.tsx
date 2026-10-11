import type { ReactNode } from "react";
import { AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppAlert({
  variant = "info",
  title,
  children,
  action,
}: {
  variant?: "error" | "info";
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  const Icon = variant === "error" ? AlertCircle : Info;
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-3 rounded-lg border p-4 text-small",
        variant === "error" ? "border-destructive/30 bg-error-soft" : "border-border bg-card",
      )}
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", variant === "error" ? "text-destructive" : "text-muted-foreground")} aria-hidden />
      <div className="min-w-0 flex-1 space-y-2">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-foreground">{children}</div>}
        {action}
      </div>
    </div>
  );
}
