"use client";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { colorOf, type EGroup, type ELesson, type Selection } from "./types";

export function Outline({ l, groups, sel, setSel }: { l: ELesson; groups: EGroup[]; sel: Selection; setSel: (s: Selection) => void }) {
  const go = (s: Selection, anchor: string) => { setSel(s); document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const item = (active: boolean) => cn("block w-full rounded-md px-2 py-1.5 text-left text-[13px] transition-colors", active ? "bg-white font-medium text-primary shadow-xs ring-1 ring-slate-200" : "text-slate-600 hover:bg-white/70");
  const isSec = (k: string) => sel?.kind === "section" && sel.key === k;
  const tasksDone = l.activities.filter((a) => a.byGroup).every((a) => groups.every((g) => a.tasks.some((t) => t.groupId === g.id && t.task.trim())));
  const flow = [
    { label: "Bài học", done: !!l.title && !!l.requirements },
    { label: "Tiến trình chung", done: l.activities.length > 0 },
    { label: "Nhiệm vụ phân hóa", done: l.activities.length > 0 && tasksDone },
    { label: "Hoàn thiện & duyệt", done: l.status === "DONE" },
  ];
  return (
    <div className="space-y-5 p-3">
      <div>
        <p className="px-2 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">Cấu trúc</p>
        <button type="button" className={item(isSec("objectives"))} onClick={() => go({ kind: "section", key: "objectives" }, "objectives")}>I. Mục tiêu</button>
        <button type="button" className={item(isSec("materials"))} onClick={() => go({ kind: "section", key: "materials" }, "materials")}>II. Thiết bị</button>
        <button type="button" className={item(false)} onClick={() => document.getElementById("progression")?.scrollIntoView({ behavior: "smooth" })}>III. Tiến trình</button>
        <div className="ml-3 border-l pl-1">
          {l.activities.map((a) => (
            <button key={a.key} type="button" className={item((sel?.kind === "activity" || sel?.kind === "task") && sel.key === a.key)} onClick={() => go({ kind: "activity", key: a.key }, `act-${a.key}`)}>
              <span className="line-clamp-1">{a.title}</span><span className="text-[11px] font-normal text-muted-foreground">{a.minutes ?? "?"} phút{a.byGroup ? " · phân hóa" : ""}</span>
            </button>
          ))}
          {!l.activities.length && <p className="px-2 py-1 text-xs text-muted-foreground">Chưa có hoạt động</p>}
        </div>
        <button type="button" className={item(isSec("assessment"))} onClick={() => go({ kind: "section", key: "assessment" }, "assessment")}>IV. Đánh giá</button>
        <button type="button" className={item(isSec("matrix"))} onClick={() => go({ kind: "section", key: "matrix" }, "matrix")}>Nhiệm vụ nhóm</button>
      </div>
      <div>
        <p className="px-2 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">Hồ sơ nhóm</p>
        <ul className="space-y-1 px-2">
          {groups.map((g, i) => (
            <li key={g.id} className="flex items-center gap-2 text-[13px]" title={g.members.join(", ")}>
              <span className={cn("size-2 shrink-0 rounded-full", colorOf(i).dot)} /><span className="min-w-0 flex-1 truncate">{g.name}</span><span className="text-[11px] text-muted-foreground">{g.members.length}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="px-2 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">Quy trình</p>
        <ol className="space-y-1 px-2">
          {flow.map((f, i) => (
            <li key={f.label} className="flex items-center gap-2 text-[13px]">
              <span className={cn("flex size-4 items-center justify-center rounded-full text-[9px] font-semibold", f.done ? "bg-success text-white" : "bg-slate-200 text-slate-500")}>{f.done ? <Check className="size-2.5" /> : i + 1}</span>
              <span className={f.done ? "text-slate-700" : "text-muted-foreground"}>{f.label}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
