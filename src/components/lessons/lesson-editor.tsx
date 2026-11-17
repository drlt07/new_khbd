"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Download, Loader2, Printer, RefreshCw, Save, Trash2, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { useMutation } from "@/hooks/use-mutation";
import { groupStyle, STYLE_LABEL, suggestTask, type Phase, type TemplateGroup } from "@/lib/lesson/template";
import { cn } from "@/lib/utils";

export type EditorGroup = TemplateGroup & { members: string[] };
type Task = { groupId: string; task: string; product: string | null; support: string | null };
type Activity = { key: string; phase: Phase; title: string; minutes: number | null; goal: string | null; content: string | null; product: string | null; organization: string | null; byGroup: boolean; tasks: Task[] };
export type LessonInitial = {
  subject: string; title: string; periods: number; requirements: string | null; knowledgeGoals: string | null; competencyGoals: string | null;
  qualityGoals: string | null; materials: string | null; assessment: string | null; status: "DRAFT" | "DONE";
  activities: Omit<Activity, "key">[];
};

let seq = 0;
const key = () => `a${++seq}`;

function Area({ id, label, value, onChange, rows = 3, className }: { id: string; label: string; value: string | null; onChange: (v: string) => void; rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-1", className)}>
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</label>
      <Textarea id={id} rows={rows} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="text-sm" />
    </div>
  );
}

export function LessonEditor({ id, classId, groupingTitle, groups, initial }: { id: string; classId: string; groupingTitle: string; groups: EditorGroup[]; initial: LessonInitial }) {
  const router = useRouter();
  const [l, setL] = useState(() => ({ ...initial, activities: initial.activities.map((a) => ({ ...a, key: key() })) }));
  const [dirty, setDirty] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const save = useMutation();
  const del = useMutation();

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const set = (p: Partial<typeof l>) => { setL((x) => ({ ...x, ...p })); setDirty(true); };
  const setAct = (k: string, p: Partial<Activity>) => { setL((x) => ({ ...x, activities: x.activities.map((a) => (a.key === k ? { ...a, ...p } : a)) })); setDirty(true); };
  const taskOf = (a: Activity, gid: string): Task => a.tasks.find((t) => t.groupId === gid) ?? { groupId: gid, task: "", product: null, support: null };
  const setTask = (a: Activity, gid: string, p: Partial<Task>) =>
    setAct(a.key, { tasks: [...a.tasks.filter((t) => t.groupId !== gid), { ...taskOf(a, gid), ...p }] });
  const lessonCtx = { subject: l.subject, title: l.title, periods: l.periods, requirements: l.requirements };
  const resuggest = (a: Activity, gids: string[]) => {
    if (a.phase === "OPENING") return;
    const fresh = gids.map((gid) => suggestTask(a.phase as Exclude<Phase, "OPENING">, lessonCtx, groups.find((g) => g.id === gid)!));
    setAct(a.key, { tasks: [...a.tasks.filter((t) => !gids.includes(t.groupId)), ...fresh] });
  };

  const totalMinutes = l.activities.reduce((s, a) => s + (a.minutes ?? 0), 0);

  async function onSave(status = l.status) {
    const res = await save.mutate(`/api/lessons/${id}`, "PUT", {
      subject: l.subject, title: l.title, periods: l.periods, requirements: l.requirements, knowledgeGoals: l.knowledgeGoals, competencyGoals: l.competencyGoals,
      qualityGoals: l.qualityGoals, materials: l.materials, assessment: l.assessment, status,
      activities: l.activities.map((a) => ({ phase: a.phase, title: a.title, minutes: a.minutes, goal: a.goal, content: a.content, product: a.product, organization: a.organization, byGroup: a.byGroup, tasks: a.tasks.filter((t) => groups.some((g) => g.id === t.groupId)) })),
    });
    if (res.ok) { setDirty(false); setL((x) => ({ ...x, status })); }
  }

  return (
    <div className="space-y-4">
      {/* Thanh hành động dính */}
      <Card className="sticky top-16 z-20 flex flex-wrap items-center gap-2 p-3 print:hidden">
        <Button onClick={() => onSave()} disabled={save.pending || !dirty}>{save.pending ? <Loader2 className="animate-spin" /> : <Save />} {dirty ? "Lưu" : "Đã lưu"}</Button>
        <Button asChild={!dirty} variant="outline" disabled={dirty} title={dirty ? "Lưu trước khi xuất" : undefined}>
          {dirty ? <span><Download /> Xuất Word</span> : <a href={`/api/lessons/${id}/export`} download><Download /> Xuất Word</a>}
        </Button>
        <Button variant="outline" onClick={() => window.print()}><Printer /> In / PDF</Button>
        <Select aria-label="Trạng thái" value={l.status} onChange={(e) => { set({ status: e.target.value as "DRAFT" | "DONE" }); }} className="h-9 w-40">
          <option value="DRAFT">Bản nháp</option>
          <option value="DONE">Đã hoàn thành</option>
        </Select>
        <span className={cn("text-xs", totalMinutes === l.periods * 45 ? "text-muted-foreground" : "text-warning")}>
          Tổng {totalMinutes}/{l.periods * 45} phút
        </span>
        <div className="flex-1" />
        <ConfirmButton variant="ghost" className="text-danger" title="Xóa KHBD này?" description="Thao tác không thể hoàn tác." confirmLabel="Xóa"
          onConfirm={async () => { const r = await del.mutate(`/api/lessons/${id}`, "DELETE", undefined, { refresh: false }); if (r.ok) { setDirty(false); router.push(`/classes/${classId}/lessons`); router.refresh(); } return r; }}>
          <Trash2 /> Xóa
        </ConfirmButton>
        {save.error && <Alert tone="danger" className="w-full">{save.error}</Alert>}
      </Card>

      <Alert tone="info" className="print:hidden">
        Nhiệm vụ từng nhóm được <b>gợi ý theo mẫu</b> từ đặc trưng nhóm ở Pha 1 (chưa dùng AI). Thầy cô chỉnh sửa trực tiếp; nút “Gợi ý lại” tạo lại nhiệm vụ mẫu sau khi đổi tên bài hoặc yêu cầu cần đạt.
      </Alert>

      <Card className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
          <div className="space-y-1"><label htmlFor="subject" className="text-xs font-medium text-muted-foreground">Môn</label><Input id="subject" value={l.subject} onChange={(e) => set({ subject: e.target.value })} /></div>
          <div className="space-y-1"><label htmlFor="title" className="text-xs font-medium text-muted-foreground">Tên bài học</label><Input id="title" value={l.title} onChange={(e) => set({ title: e.target.value })} className="font-semibold" /></div>
          <div className="space-y-1"><label htmlFor="periods" className="text-xs font-medium text-muted-foreground">Số tiết</label><Input id="periods" type="number" min={1} max={10} value={l.periods} onChange={(e) => set({ periods: Number(e.target.value) || 1 })} className="w-20" /></div>
        </div>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><Users className="size-4" /> Bộ nhóm: {groupingTitle} · {groups.length} nhóm</p>
      </Card>

      <Card className="space-y-3 p-5">
        <h2 className="font-semibold">I. Mục tiêu</h2>
        <Area id="req" label="Yêu cầu cần đạt (mỗi dòng một ý)" value={l.requirements} onChange={(v) => set({ requirements: v })} />
        <div className="grid gap-3 md:grid-cols-3">
          <Area id="kg" label="1. Kiến thức" value={l.knowledgeGoals} onChange={(v) => set({ knowledgeGoals: v })} />
          <Area id="cg" label="2. Năng lực" value={l.competencyGoals} onChange={(v) => set({ competencyGoals: v })} />
          <Area id="qg" label="3. Phẩm chất" value={l.qualityGoals} onChange={(v) => set({ qualityGoals: v })} />
        </div>
        <h2 className="pt-2 font-semibold">II. Thiết bị dạy học và học liệu</h2>
        <Area id="mat" label="Thiết bị, học liệu" value={l.materials} onChange={(v) => set({ materials: v })} rows={2} />
      </Card>

      <h2 className="pt-2 text-lg font-semibold">III. Tiến trình dạy học</h2>
      {l.activities.map((a) => (
        <Card key={a.key} className="space-y-3 p-5 print:break-inside-avoid">
          <div className="flex flex-wrap items-center gap-2">
            <Input aria-label="Tên hoạt động" value={a.title} onChange={(e) => setAct(a.key, { title: e.target.value })} className="h-9 w-full font-semibold sm:w-auto sm:min-w-60 sm:flex-1" />
            <div className="flex items-center gap-1 text-sm"><Input aria-label="Số phút" type="number" min={1} value={a.minutes ?? ""} onChange={(e) => setAct(a.key, { minutes: e.target.value ? Number(e.target.value) : null })} className="h-9 w-20" /> phút</div>
            <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={a.byGroup} onChange={(e) => setAct(a.key, { byGroup: e.target.checked })} /> Giao nhiệm vụ theo nhóm</label>
          </div>
          <button type="button" onClick={() => setOpen((o) => ({ ...o, [a.key]: !o[a.key] }))} aria-expanded={!!open[a.key]} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline print:hidden">
            <ChevronDown className={cn("size-4 transition-transform", open[a.key] && "rotate-180")} /> Mục tiêu, nội dung, sản phẩm, tổ chức thực hiện
          </button>
          <div className={cn("grid gap-3 md:grid-cols-2", !open[a.key] && "hidden print:grid")}>
            <Area id={`${a.key}-goal`} label="a) Mục tiêu" value={a.goal} onChange={(v) => setAct(a.key, { goal: v })} rows={2} />
            <Area id={`${a.key}-content`} label="b) Nội dung" value={a.content} onChange={(v) => setAct(a.key, { content: v })} rows={2} />
            <Area id={`${a.key}-product`} label="c) Sản phẩm" value={a.product} onChange={(v) => setAct(a.key, { product: v })} rows={2} />
            <Area id={`${a.key}-org`} label="d) Tổ chức thực hiện" value={a.organization} onChange={(v) => setAct(a.key, { organization: v })} rows={4} />
          </div>

          {a.byGroup && (
            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">Nhiệm vụ của từng nhóm</p>
                <div className="flex-1" />
                {a.phase !== "OPENING" && <Button variant="ghost" size="sm" className="print:hidden" onClick={() => resuggest(a, groups.map((g) => g.id))}><RefreshCw /> Gợi ý lại tất cả</Button>}
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {groups.map((g, gi) => {
                  const t = taskOf(a, g.id);
                  return (
                    <div key={g.id} className="min-w-0 space-y-2 rounded-lg border p-3">
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">{gi + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{g.name} <span className="ml-1 rounded bg-muted px-1.5 text-[11px] font-normal text-muted-foreground">{STYLE_LABEL[groupStyle(g)]}</span></p>
                          <p className="truncate text-xs text-muted-foreground" title={g.members.join(", ")}>{g.members.length} HS: {g.members.join(", ") || "—"}</p>
                        </div>
                        {a.phase !== "OPENING" && (
                          <button type="button" title="Gợi ý lại nhiệm vụ cho nhóm này" aria-label={`Gợi ý lại cho ${g.name}`} onClick={() => resuggest(a, [g.id])} className="rounded p-1 text-muted-foreground hover:bg-muted print:hidden"><RefreshCw className="size-4" /></button>
                        )}
                      </div>
                      <Area id={`${a.key}-${g.id}-task`} label="Nhiệm vụ" value={t.task} onChange={(v) => setTask(a, g.id, { task: v })} rows={3} />
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Area id={`${a.key}-${g.id}-prod`} label="Sản phẩm" value={t.product} onChange={(v) => setTask(a, g.id, { product: v })} rows={2} />
                        <Area id={`${a.key}-${g.id}-sup`} label="Hỗ trợ / học liệu" value={t.support} onChange={(v) => setTask(a, g.id, { support: v })} rows={2} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      ))}

      <Card className="space-y-3 p-5">
        <h2 className="font-semibold">IV. Đánh giá</h2>
        <Area id="assess" label="Phương án đánh giá (tiêu chí, công cụ, hình thức)" value={l.assessment} onChange={(v) => set({ assessment: v })} />
      </Card>
    </div>
  );
}
