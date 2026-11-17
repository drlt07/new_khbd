import { cn } from "@/lib/utils";

/** Hiển thị gọn: sở thích (tím), thế mạnh (xanh), cần hỗ trợ (cam) */
export function TraitChips({ interests, strengths, needs, className }: { interests: string[]; strengths: string[]; needs: string[]; className?: string }) {
  if (!interests.length && !strengths.length && !needs.length) return <span className="text-xs text-muted-foreground">Chưa có thông tin</span>;
  const chip = "rounded-full px-2 py-0.5 text-[11px] font-medium";
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {interests.map((x) => <span key={"i" + x} className={cn(chip, "bg-primary-soft text-primary")} title="Sở thích">{x}</span>)}
      {strengths.map((x) => <span key={"s" + x} className={cn(chip, "bg-success-soft text-success")} title="Thế mạnh">★ {x}</span>)}
      {needs.map((x) => <span key={"n" + x} className={cn(chip, "bg-warning-soft text-warning")} title="Cần hỗ trợ">⚑ {x}</span>)}
    </div>
  );
}

export function TraitLegend() {
  return (
    <p className="flex flex-wrap gap-3 text-xs text-muted-foreground">
      <span><span className="rounded-full bg-primary-soft px-2 text-primary">Sở thích</span></span>
      <span><span className="rounded-full bg-success-soft px-2 text-success">★ Thế mạnh</span></span>
      <span><span className="rounded-full bg-warning-soft px-2 text-warning">⚑ Cần hỗ trợ</span></span>
    </p>
  );
}
