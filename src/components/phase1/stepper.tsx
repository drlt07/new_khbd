import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export const PHASE1_STEPS = [
  { n: 1, title: "Dữ liệu", desc: "Điểm số & đặc trưng" },
  { n: 2, title: "Tiêu chí", desc: "Số nhóm & mô tả nhóm" },
  { n: 3, title: "Phân nhóm", desc: "AI phân bổ & giải thích" },
  { n: 4, title: "Duyệt nhóm", desc: "Chỉnh sửa & xác nhận" },
] as const;

export type StepState = { n: number; done: boolean; locked: string | null };

/** Stepper kiểu Linear: biết đang ở bước nào, bước nào xong, bước nào bị khóa và vì sao */
export function Stepper({ base, current, states }: { base: string; current: number; states: StepState[] }) {
  return (
    <ol className="grid grid-cols-2 gap-2 md:grid-cols-4" aria-label="Các bước Pha 1">
      {PHASE1_STEPS.map((s) => {
        const st = states.find((x) => x.n === s.n)!;
        const isCurrent = s.n === current;
        const inner = (
          <span className={cn("flex h-full items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
            isCurrent ? "border-primary bg-primary-soft/60 ring-1 ring-primary/30" : st.locked ? "border-dashed bg-muted/40" : "bg-card hover:border-primary/40")}>
            <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
              st.done ? "bg-success text-white" : isCurrent ? "bg-primary text-white" : st.locked ? "bg-slate-200 text-slate-500" : "bg-slate-100 text-slate-600")}>
              {st.done ? <Check className="size-4" /> : st.locked ? <Lock className="size-3.5" /> : s.n}
            </span>
            <span className="min-w-0 leading-tight">
              <span className={cn("block text-sm font-medium", st.locked && "text-muted-foreground")}>{s.n}. {s.title}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{st.locked ?? s.desc}</span>
            </span>
          </span>
        );
        return (
          <li key={s.n} aria-current={isCurrent ? "step" : undefined}>
            {st.locked ? <span aria-disabled title={st.locked}>{inner}</span> : <Link href={`${base}?step=${s.n}`}>{inner}</Link>}
          </li>
        );
      })}
    </ol>
  );
}
