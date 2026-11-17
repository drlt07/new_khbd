"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bot, ChevronDown, Copy, Download, FileDown, ListTree, Loader2, MoreHorizontal, RefreshCw, Save, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { useMutation } from "@/hooks/use-mutation";
import { cn } from "@/lib/utils";
import { AssistantPanel } from "./assistant";
import { LessonDocument } from "./document";
import { Outline } from "./outline";
import { colorOf, type EActivity, type EGroup, type ELesson, type ETask, type Selection } from "./types";

export function LessonWorkspace({ id, initial, groups, session, latest, className, engine, initialNotice }: {
  id: string; initial: ELesson; groups: EGroup[]; className: string;
  session: { id: string; title: string; version: number; status: "DRAFT" | "CONFIRMED" | "SUPERSEDED" };
  latest: { id: string; version: number } | null; engine: { kind: "claude" | "rules"; label: string }; initialNotice?: string | null;
}) {
  const router = useRouter();
  const [l, setL] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [sel, setSel] = useState<Selection>(null);
  const [panel, setPanel] = useState<"outline" | "assistant" | null>(null);
  const [notice, setNotice] = useState<string | null>(initialNotice ?? null);
  const save = useMutation();
  const op = useMutation();

  const set = (p: Partial<ELesson>) => { setL((x) => ({ ...x, ...p })); setDirty(true); };
  const setAct = (key: string, p: Partial<EActivity>) => { setL((x) => ({ ...x, activities: x.activities.map((a) => (a.key === key ? { ...a, ...p } : a)) })); setDirty(true); };
  const setTask = (key: string, groupId: string, p: Partial<ETask>) => {
    setL((x) => ({ ...x, activities: x.activities.map((a) => {
      if (a.key !== key) return a;
      const cur = a.tasks.find((t) => t.groupId === groupId) ?? { groupId, task: "", product: null, support: null, materials: null, challenge: null, assessment: null };
      return { ...a, tasks: [...a.tasks.filter((t) => t.groupId !== groupId), { ...cur, ...p }] };
    }) }));
    setDirty(true);
  };
  const applyTasks = (key: string, tasks: ETask[]) => tasks.forEach((t) => setTask(key, t.groupId, t));

  const doSave = useCallback(async (status = l.status) => {
    const r = await save.mutate(`/api/lessons/${id}`, "PUT", {
      subject: l.subject, title: l.title, periods: l.periods, requirements: l.requirements, content: l.content, methods: l.methods,
      knowledgeGoals: l.knowledgeGoals, competencyGoals: l.competencyGoals, qualityGoals: l.qualityGoals, materials: l.materials, assessment: l.assessment, status,
      activities: l.activities.map((a) => ({ phase: a.phase, title: a.title, minutes: a.minutes, goal: a.goal, content: a.content, product: a.product, organization: a.organization, byGroup: a.byGroup, tasks: a.tasks.filter((t) => t.task.trim()) })),
    }, { refresh: false });
    if (r.ok) { setDirty(false); setL((x) => ({ ...x, status })); }
    return r.ok;
  }, [l, id, save]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); if (dirty) doSave(); } };
    const onLeave = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("keydown", onKey); window.addEventListener("beforeunload", onLeave);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("beforeunload", onLeave); };
  }, [dirty, doSave]);

  async function generate() {
    if (dirty && !(await doSave())) return;
    const r = await op.mutate<{ engine: string; note?: string }>(`/api/lessons/${id}/generate`, "POST", undefined, { refresh: false });
    if (r.ok) { router.replace(`/phase2/${id}?${new URLSearchParams({ n: "generated", e: r.data.engine, ...(r.data.note ? { note: r.data.note } : {}) })}`); router.refresh(); }
  }
  async function upgrade() {
    if (dirty && !(await doSave())) return;
    const r = await op.mutate<{ version: number; mapped: number; added: number; removed: number }>(`/api/lessons/${id}/upgrade`, "POST", undefined, { refresh: false });
    if (r.ok) { router.replace(`/phase2/${id}?${new URLSearchParams({ n: "upgraded", v: String(r.data.version), m: String(r.data.mapped), a: String(r.data.added), r: String(r.data.removed) })}`); router.refresh(); }
  }
  async function duplicate() {
    const r = await op.mutate<{ id: string }>(`/api/lessons/${id}/duplicate`, "POST", undefined, { refresh: false });
    if (r.ok) router.push(`/phase2/${r.data.id}`);
  }

  const total = l.activities.reduce((a, x) => a + (x.minutes ?? 0), 0);
  const assistant = <AssistantPanel lessonId={id} l={l} groups={groups} sel={sel} setSel={setSel} engine={engine} applyTasks={applyTasks} applyTask={setTask} />;
  const outline = <Outline l={l} groups={groups} sel={sel} setSel={(s) => { setSel(s); setPanel(null); }} />;

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col">
      {/* THANH TRÊN — THÔNG TIN BÀI DẠY */}
      <div className="flex flex-wrap items-center gap-2 border-b bg-card px-3 py-2 sm:px-4">
        <Link href="/phase2" className="hidden text-xs font-semibold uppercase tracking-wide text-success sm:block">Pha 2</Link>
        <Input aria-label="Tên bài" value={l.title} onChange={(e) => set({ title: e.target.value })} className="h-9 min-w-0 flex-1 border-transparent text-base font-semibold hover:border-slate-200 sm:max-w-sm" />
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <Input aria-label="Môn học" value={l.subject} onChange={(e) => set({ subject: e.target.value })} className="h-8 w-24 text-xs" />
          <span className="rounded-md border px-2 py-1.5 text-muted-foreground">Lớp {className}</span>
          <span className="flex items-center gap-1 rounded-md border pl-1"><Input aria-label="Số tiết" type="number" min={1} max={10} value={l.periods} onChange={(e) => set({ periods: Number(e.target.value) || 1 })} className="h-6 w-12 border-0 px-1 text-xs" /><span className="pr-2 text-muted-foreground">tiết</span></span>
          <span className={cn("rounded-md px-2 py-1.5", total === l.periods * 45 ? "text-muted-foreground" : "bg-warning-soft text-warning")}>{total}/{l.periods * 45} phút</span>
          <select aria-label="Trạng thái" value={l.status} onChange={(e) => set({ status: e.target.value as ELesson["status"] })} className="h-8 rounded-md border bg-card px-2">
            <option value="DRAFT">Bản nháp</option><option value="REVIEW">Chờ duyệt</option><option value="DONE">Hoàn thành</option>
          </select>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="hidden text-xs text-muted-foreground md:inline">{save.pending ? "Đang lưu…" : dirty ? "Chưa lưu" : "Đã lưu"}</span>
          <Button size="sm" onClick={() => doSave()} disabled={save.pending || !dirty} title="Ctrl+S">{save.pending ? <Loader2 className="animate-spin" /> : <Save />} Lưu</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button size="sm" variant="outline" disabled={dirty} title={dirty ? "Lưu trước khi xuất" : undefined}><Download /> Xuất KHBD <ChevronDown /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild><a href={`/api/lessons/${id}/export`} download><FileDown /> Word (.docx)</a></DropdownMenuItem>
              <DropdownMenuItem asChild><a href={`/phase2/${id}/print`} target="_blank" rel="noreferrer"><FileDown /> PDF (in / lưu PDF)</a></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" aria-label="Thêm thao tác" className="size-8"><MoreHorizontal /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={duplicate}><Copy /> Nhân bản KHBD</DropdownMenuItem>
              {l.activities.length > 0 && <DropdownMenuItem onSelect={() => { if (window.confirm("Tạo lại toàn bộ tiến trình và nhiệm vụ? Nội dung hoạt động hiện tại sẽ bị thay thế.")) generate(); }}><RefreshCw /> Tạo lại tiến trình</DropdownMenuItem>}
              <DropdownMenuItem asChild><Link href={`/phase1/${session.id}?step=4`}><ListTree /> Xem hồ sơ nhóm (Pha 1)</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <ConfirmButton variant="ghost" size="sm" className="w-full justify-start text-danger" title="Xóa KHBD này?" description="Không thể hoàn tác." confirmLabel="Xóa"
                onConfirm={async () => { const r = await op.mutate(`/api/lessons/${id}`, "DELETE", undefined, { refresh: false }); if (r.ok) { setDirty(false); router.push("/phase2"); } return r; }}><Trash2 /> Xóa KHBD</ConfirmButton>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {session.status === "SUPERSEDED" && latest && (
        <div className="flex flex-wrap items-center gap-2 border-b bg-danger-soft px-4 py-2 text-sm text-danger">
          <AlertTriangle className="size-4 shrink-0" /><span className="min-w-0 flex-1">KHBD đang dùng hồ sơ nhóm “{session.title}” <b>v{session.version}</b>, nhưng giáo viên đã duyệt <b>v{latest.version}</b> (thành viên hoặc đặc trưng nhóm đã thay đổi).</span>
          <Button size="sm" variant="destructive" onClick={upgrade} disabled={op.pending}>{op.pending ? <Loader2 className="animate-spin" /> : <RefreshCw />} Cập nhật theo v{latest.version}</Button>
        </div>
      )}
      {(notice || op.error || save.error) && (
        <div className="border-b px-4 py-2">{op.error || save.error ? <Alert tone="danger">{op.error ?? save.error}</Alert> : <Alert tone="success" className="flex items-center justify-between gap-2">{notice}<button className="text-xs underline" onClick={() => { setNotice(null); router.replace(`/phase2/${id}`); }}>Đóng</button></Alert>}</div>
      )}

      {/* 3 VÙNG LÀM VIỆC */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[15rem_minmax(0,1fr)_21rem]">
        <aside className="hidden overflow-y-auto border-r bg-slate-50 lg:block">{outline}</aside>
        <main className="min-w-0 overflow-y-auto bg-slate-100/60 px-2 py-6 sm:px-6">
          <div className="mb-3 flex gap-2 lg:hidden">
            <Button size="sm" variant="outline" onClick={() => setPanel("outline")}><ListTree /> Cấu trúc</Button>
            <Button size="sm" variant="outline" onClick={() => setPanel("assistant")}><Bot /> Trợ lý AI</Button>
          </div>
          {l.activities.length === 0 ? (
            <div className="mx-auto max-w-2xl space-y-4 rounded-xl border bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-success">Bước tiếp theo</p>
              <h2 className="text-xl font-semibold">Tạo tiến trình chung & phân hóa nhiệm vụ</h2>
              <p className="text-sm text-muted-foreground">{engine.kind === "claude" ? "Claude AI" : "Bộ máy quy tắc"} sẽ xây dựng mục tiêu, 4 hoạt động (CV 5512) và nhiệm vụ riêng cho từng nhóm dựa trên hồ sơ nhóm đã duyệt — trong một KHBD thống nhất.</p>
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p><b>Bài:</b> {l.title} · {l.periods} tiết · {l.subject}</p>
                {l.requirements && <p className="mt-1"><b>Yêu cầu cần đạt:</b> {l.requirements}</p>}
              </div>
              <ul className="grid gap-2 sm:grid-cols-2">
                {groups.map((g, i) => (
                  <li key={g.id} className={cn("rounded-lg border border-l-4 p-2.5 text-xs", colorOf(i).border)}>
                    <p className="font-semibold">{g.name} · {g.members.length} HS</p><p className="text-muted-foreground">{g.competency ?? g.profile}</p>
                  </li>
                ))}
              </ul>
              <Button onClick={generate} disabled={op.pending} size="lg">{op.pending ? <Loader2 className="animate-spin" /> : <Sparkles />} {op.pending ? "Đang tạo…" : "Tạo tiến trình & nhiệm vụ phân hóa"}</Button>
            </div>
          ) : (
            <LessonDocument l={l} groups={groups} sel={sel} setSel={setSel} set={set} setAct={setAct} setTask={setTask} />
          )}
        </main>
        <aside className="hidden overflow-y-auto border-l bg-white lg:block">{assistant}</aside>
      </div>

      <Sheet open={!!panel} onOpenChange={(o) => !o && setPanel(null)}>
        <SheetContent side={panel === "assistant" ? "right" : "left"} className="w-80 overflow-y-auto" aria-describedby={undefined}>
          <SheetTitle className="sr-only">{panel === "assistant" ? "Trợ lý AI" : "Cấu trúc KHBD"}</SheetTitle>
          {panel === "assistant" ? assistant : outline}
        </SheetContent>
      </Sheet>
    </div>
  );
}
