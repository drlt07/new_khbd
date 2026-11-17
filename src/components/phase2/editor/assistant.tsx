"use client";
import { useState } from "react";
import { AlertCircle, ArrowDown, ArrowUp, Bot, CheckCircle2, ClipboardCheck, FileText, Loader2, Sparkles, Wand2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useMutation } from "@/hooks/use-mutation";
import { checkLesson, type LessonCheck } from "@/lib/lesson/template";
import { cn } from "@/lib/utils";
import { colorOf, type EActivity, type EGroup, type ELesson, type ETask, type Selection } from "./types";

type Proposal =
  | { kind: "tasks"; activityKey: string; tasks: ETask[]; engine: string; note?: string }
  | { kind: "task"; activityKey: string; groupId: string; before: ETask; after: ETask; label: string; engine: string }
  | { kind: "material"; activityKey: string; groupId: string; text: string; engine: string }
  | { kind: "check"; items: LessonCheck[] };

const engineName = (e: string) => (e.startsWith("claude") ? "Claude AI" : e.includes("fallback") ? "Quy tắc (AI lỗi, dự phòng)" : "Bộ máy quy tắc");

export function AssistantPanel({ lessonId, l, groups, sel, setSel, engine, applyTasks, applyTask }: {
  lessonId: string; l: ELesson; groups: EGroup[]; sel: Selection; setSel: (s: Selection) => void; engine: { kind: "claude" | "rules"; label: string };
  applyTasks: (activityKey: string, tasks: ETask[]) => void; applyTask: (activityKey: string, groupId: string, p: Partial<ETask>) => void;
}) {
  const [prop, setProp] = useState<Proposal | null>(null);
  const { mutate, pending, error } = useMutation();
  const act: EActivity | undefined = sel && (sel.kind === "activity" || sel.kind === "task") ? l.activities.find((a) => a.key === sel.key) : undefined;
  const gi = sel?.kind === "task" ? groups.findIndex((g) => g.id === sel.groupId) : -1;
  const group = gi >= 0 ? groups[gi] : undefined;
  const task = act && group ? act.tasks.find((t) => t.groupId === group.id) ?? { groupId: group.id, task: "", product: null, support: null, materials: null, challenge: null, assessment: null } : undefined;
  const lessonInfo = { subject: l.subject, title: l.title, periods: l.periods, requirements: l.requirements, content: l.content, methods: l.methods };

  async function run(action: "suggest" | "easier" | "harder" | "material") {
    if (!act) return;
    setProp(null);
    const r = await mutate<{ tasks?: ETask[]; task?: ETask; material?: string; engine: string; note?: string }>(`/api/lessons/${lessonId}/assist`, "POST",
      { action, lesson: lessonInfo, phase: act.phase, activityTitle: act.title, groupId: action === "suggest" ? undefined : group?.id, task: action === "suggest" ? undefined : task }, { refresh: false });
    if (!r.ok) return;
    if (action === "suggest") setProp({ kind: "tasks", activityKey: act.key, tasks: r.data.tasks ?? [], engine: r.data.engine, note: r.data.note });
    else if (action === "material") setProp({ kind: "material", activityKey: act.key, groupId: group!.id, text: r.data.material ?? "", engine: r.data.engine });
    else setProp({ kind: "task", activityKey: act.key, groupId: group!.id, before: task!, after: r.data.task!, label: action === "easier" ? "Dễ hơn" : "Khó hơn", engine: r.data.engine });
  }
  function check() {
    setProp({ kind: "check", items: checkLesson(l, groups) });
  }
  function jump(target?: string) {
    if (!target) return;
    if (["objectives", "assessment"].includes(target)) { setSel({ kind: "section", key: target as "objectives" }); document.getElementById(target)?.scrollIntoView({ behavior: "smooth" }); }
    else { setSel({ kind: "activity", key: target }); document.getElementById(`act-${target}`)?.scrollIntoView({ behavior: "smooth" }); }
  }

  const ctx = sel?.kind === "task" ? `${act?.title} › ${group?.name}` : sel?.kind === "activity" ? act?.title : sel?.kind === "section" ? { objectives: "I. Mục tiêu", materials: "II. Thiết bị", assessment: "IV. Đánh giá", matrix: "Bảng nhiệm vụ nhóm" }[sel.key] : null;
  const canAct = !!act && act.phase !== "OPENING";
  const Action = ({ icon: Icon, title, desc, onClick, disabled, children }: { icon: typeof Wand2; title: string; desc: string; onClick?: () => void; disabled?: boolean; children?: React.ReactNode }) => (
    <div className={cn("rounded-lg border bg-card p-3", disabled && "opacity-55")}>
      <button type="button" onClick={onClick} disabled={disabled || pending || !onClick} className="flex w-full items-start gap-2 text-left disabled:cursor-not-allowed">
        <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
        <span><span className="block text-sm font-medium">{title}</span><span className="block text-xs text-muted-foreground">{desc}</span></span>
      </button>
      {children}
    </div>
  );

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-white"><Bot className="size-4" /></span>
        <div><p className="text-sm font-semibold">AI Assistant</p><p className="text-[11px] text-muted-foreground">{engine.kind === "claude" ? "Claude AI · dữ liệu ẩn danh" : "Bộ máy quy tắc (chưa cấu hình Claude API)"}</p></div>
      </div>
      <div className="rounded-lg bg-muted/60 px-3 py-2 text-xs">{ctx ? <>Đang chọn: <b>{ctx}</b></> : "Chọn một hoạt động hoặc nhiệm vụ nhóm trong tài liệu để dùng trợ lý."}</div>

      {group && (
        <div className={cn("rounded-lg border border-l-4 p-3 text-xs", colorOf(gi).border)}>
          <p className="font-semibold">{group.name} · {group.members.length} HS</p>
          {group.competency && <p className="mt-1 text-muted-foreground">{group.competency}</p>}
          {group.needs && <p className="mt-1"><b className="font-medium">Nhu cầu:</b> {group.needs}</p>}
          {group.supportGoal && <p className="mt-1"><b className="font-medium">Mục tiêu hỗ trợ:</b> {group.supportGoal}</p>}
        </div>
      )}

      <Action icon={Sparkles} title="Gợi ý điều chỉnh nhiệm vụ theo từng nhóm" desc={canAct ? `Đề xuất lại nhiệm vụ của “${act!.title}” cho ${groups.length} nhóm dựa trên hồ sơ nhóm` : "Chọn hoạt động 2–4 (hoạt động có phân hóa)"} onClick={canAct ? () => run("suggest") : undefined} disabled={!canAct} />
      <Action icon={FileText} title="Tạo học liệu" desc={task ? `Phiếu học tập cho ${group!.name}` : "Chọn nhiệm vụ của một nhóm"} onClick={task && canAct ? () => run("material") : undefined} disabled={!task || !canAct} />
      <Action icon={Wand2} title="Điều chỉnh độ khó" desc={task ? `Nhiệm vụ của ${group!.name}` : "Chọn nhiệm vụ của một nhóm"} disabled={!task || !canAct}>
        {task && canAct && (
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="outline" onClick={() => run("easier")} disabled={pending}><ArrowDown /> Dễ hơn</Button>
            <Button size="sm" variant="outline" onClick={() => run("harder")} disabled={pending}><ArrowUp /> Khó hơn</Button>
          </div>
        )}
      </Action>
      <Action icon={ClipboardCheck} title="Kiểm tra mục tiêu" desc="Đối chiếu yêu cầu cần đạt, thời lượng, nhiệm vụ đủ cho mọi nhóm, 4 bước tổ chức" onClick={check} />

      {pending && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Trợ lý đang xử lý…</p>}
      {error && <Alert tone="danger">{error}</Alert>}

      {prop && (
        <div className="space-y-2 rounded-lg border border-primary/30 bg-primary-soft/30 p-3">
          {prop.kind === "tasks" && (
            <>
              <p className="text-xs font-semibold">Đề xuất nhiệm vụ · {engineName(prop.engine)}</p>
              {prop.note && <p className="text-xs text-warning">{prop.note}</p>}
              {prop.tasks.map((t) => {
                const i = groups.findIndex((g) => g.id === t.groupId);
                return (
                  <div key={t.groupId} className="rounded-md border bg-card p-2 text-xs">
                    <p className={cn("font-semibold", colorOf(i).text)}>{groups[i]?.name}</p>
                    <p className="mt-0.5">{t.task}</p>
                    {t.challenge && <p className="mt-0.5 text-muted-foreground">Thử thách: {t.challenge}</p>}
                    <Button size="sm" variant="ghost" className="mt-1 h-7" onClick={() => applyTasks(prop.activityKey, [t])}>Áp dụng cho nhóm này</Button>
                  </div>
                );
              })}
              <Button size="sm" onClick={() => { applyTasks(prop.activityKey, prop.tasks); setProp(null); }}>Áp dụng tất cả</Button>
            </>
          )}
          {prop.kind === "task" && (
            <>
              <p className="text-xs font-semibold">{prop.label} · {engineName(prop.engine)}</p>
              <p className="rounded bg-card p-2 text-xs text-muted-foreground line-through decoration-slate-300">{prop.before.task}</p>
              <p className="rounded bg-card p-2 text-xs">{prop.after.task}</p>
              <p className="text-xs text-muted-foreground">Mức thử thách: {prop.after.challenge}</p>
              <div className="flex gap-2"><Button size="sm" onClick={() => { applyTask(prop.activityKey, prop.groupId, prop.after); setProp(null); }}>Áp dụng</Button><Button size="sm" variant="ghost" onClick={() => setProp(null)}>Bỏ qua</Button></div>
            </>
          )}
          {prop.kind === "material" && (
            <>
              <p className="text-xs font-semibold">Học liệu đề xuất · {engineName(prop.engine)}</p>
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded bg-card p-2 font-sans text-xs">{prop.text}</pre>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => { const cur = l.activities.find((a) => a.key === prop.activityKey)?.tasks.find((t) => t.groupId === prop.groupId)?.materials; applyTask(prop.activityKey, prop.groupId, { materials: [cur, prop.text].filter(Boolean).join("\n\n") }); setProp(null); }}>Đưa vào ô Học liệu</Button>
                <Button size="sm" variant="ghost" onClick={() => navigator.clipboard?.writeText(prop.text)}>Sao chép</Button>
              </div>
            </>
          )}
          {prop.kind === "check" && (
            <>
              <p className="text-xs font-semibold">Kết quả kiểm tra ({prop.items.filter((i) => i.level !== "ok").length} vấn đề)</p>
              <ul className="space-y-1.5">
                {prop.items.map((i, k) => (
                  <li key={k}>
                    <button type="button" onClick={() => jump(i.target)} disabled={!i.target} className="flex w-full items-start gap-2 text-left text-xs enabled:hover:underline">
                      {i.level === "ok" ? <CheckCircle2 className="size-3.5 shrink-0 text-success" /> : i.level === "error" ? <XCircle className="size-3.5 shrink-0 text-danger" /> : <AlertCircle className="size-3.5 shrink-0 text-warning" />}{i.message}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
