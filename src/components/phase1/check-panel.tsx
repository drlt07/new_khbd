import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";
import type { CheckIssue } from "@/lib/grouping/check";
import { cn } from "@/lib/utils";

export function CheckPanel({ fitRate, issues, compact }: { fitRate: number; issues: CheckIssue[]; compact?: boolean }) {
  const errors = issues.filter((i) => i.level === "error").length;
  return (
    <div className={cn("rounded-lg border bg-card", compact ? "p-3" : "p-4")}>
      <div className="flex items-center gap-3">
        <div className="relative size-12 shrink-0">
          <svg viewBox="0 0 36 36" className="size-12 -rotate-90"><circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3.5" className="stroke-slate-200" />
            <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3.5" strokeDasharray={`${fitRate} 100`} strokeLinecap="round" className={fitRate >= 70 ? "stroke-success" : fitRate >= 40 ? "stroke-warning" : "stroke-danger"} /></svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold tabular-nums">{fitRate}%</span>
        </div>
        <div>
          <p className="text-sm font-semibold">Kiểm tra mức độ phù hợp</p>
          <p className="text-xs text-muted-foreground">{fitRate}% học sinh khớp tiêu chí nhóm của mình{errors ? ` · ${errors} lỗi cần sửa trước khi xác nhận` : ""}</p>
        </div>
      </div>
      {issues.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {issues.map((i, k) => (
            <li key={k} className="flex items-start gap-2 text-sm">
              {i.level === "error" ? <XCircle className="mt-0.5 size-4 shrink-0 text-danger" /> : i.level === "warning" ? <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" /> : <Info className="mt-0.5 size-4 shrink-0 text-info" />}
              {i.message}
            </li>
          ))}
        </ul>
      ) : <p className="mt-3 flex items-center gap-2 text-sm text-success"><CheckCircle2 className="size-4" /> Không phát hiện vấn đề.</p>}
    </div>
  );
}
