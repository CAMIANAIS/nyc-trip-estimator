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
        "animate-in fade-in flex gap-3 rounded-lg border p-5 text-small duration-300",
        variant === "error" ? "border-destructive/20 border-l-4 border-l-destructive bg-error-soft" : "bg-card",
      )}
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", variant === "error" ? "text-destructive" : "text-muted-foreground")} aria-hidden />
      <div className="min-w-0 flex-1 space-y-3">
        <div>
          {title && <p className="text-base font-semibold">{title}</p>}
          {children && <p className="text-foreground">{children}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
