import * as React from "react";
import { cn } from "@/lib/utils";

const tones = {
  info: "border-info/20 bg-info-soft text-info",
  warning: "border-warning/30 bg-warning-soft text-warning",
  danger: "border-danger/30 bg-danger-soft text-danger",
  success: "border-success/30 bg-success-soft text-success",
};

export function Alert({
  tone = "info",
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { tone?: keyof typeof tones }) {
  return <div role="alert" className={cn("rounded-lg border p-3 text-sm", tones[tone], className)} {...props} />;
}
