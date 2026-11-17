import { cn } from "@/lib/utils";

/** Thanh hành động cố định cuối mỗi bước (kiểu Linear) */
export function StepFooter({ children, hint, className }: { children: React.ReactNode; hint?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("sticky bottom-0 z-10 -mx-4 mt-6 flex flex-col gap-2 border-t bg-card/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:flex-row sm:items-center sm:px-6", className)}>
      <div className="flex-1 text-xs text-muted-foreground">{hint}</div>
      <div className="flex flex-wrap justify-end gap-2">{children}</div>
    </div>
  );
}
