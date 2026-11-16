import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label, value, icon: Icon, hint, accent = "primary",
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  hint?: string;
  accent?: "primary" | "success" | "warning" | "info";
}) {
  const accents = {
    primary: "bg-primary-soft text-primary",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    info: "bg-info-soft text-info",
  };
  return (
    <Card className="flex items-start gap-4 p-5">
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", accents[accent])}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </Card>
  );
}
