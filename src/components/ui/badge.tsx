import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", {
  variants: {
    tone: {
      neutral: "bg-muted text-muted-foreground",
      info: "bg-info-soft text-info",
      warning: "bg-warning-soft text-warning",
      success: "bg-success-soft text-success",
      danger: "bg-danger-soft text-danger",
      primary: "bg-primary-soft text-primary",
      sample: "border border-dashed border-warning/50 bg-warning-soft text-warning",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

export function Badge({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

/** Nhãn bắt buộc cho mọi dữ liệu mẫu (Yêu cầu chất lượng #12). */
export function SampleBadge() {
  return (
    <Badge tone="sample" title="Dữ liệu mẫu dùng để kiểm thử, không phải dữ liệu thật">
      Dữ liệu mẫu
    </Badge>
  );
}
