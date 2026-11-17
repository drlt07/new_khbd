"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2, RefreshCw, Save, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { TagInput } from "@/components/ui/tag-input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { TraitChips } from "@/components/students/trait-chips";
import { useMutation } from "@/hooks/use-mutation";
import { checkGrouping } from "@/lib/grouping/check";
import type { MStudent } from "@/lib/grouping/match";
import { cn, initials } from "@/lib/utils";
import { CheckPanel } from "./check-panel";
import { fitBadge, specOf, type StepGroup } from "./step-analysis";
import { StepFooter } from "./step-footer";

const f1 = (x: number | null | undefined) => (x == null ? null : (Math.round(x * 10) / 10).toString().replace(".", ","));
const OUT = "__out__";

export function StepReview({ id, status, groups: initial, students, confirmedNote }: { id: string; status: "DRAFT" | "CONFIRMED" | "SUPERSEDED"; groups: StepGroup[]; students: MStudent[]; confirmedNote?: string | null }) {
  const router = useRouter();
  const readOnly = status !== "DRAFT";
  const [groups, setGroups] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const save = useMutation();
  const action = useMutation();
  const byId = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);
  const check = useMemo(() => checkGrouping(groups.map((g) => ({ ...specOf(g), members: g.members.map((m) => m.studentId) })), students, students.map((s) => s.id)), [groups, students]);
  const assigned = new Set(groups.flatMap((g) => g.members.map((m) => m.studentId)));
  const outside = students.filter((s) => !assigned.has(s.id));
  const current = groups.find((g) => g.id === open);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const update = (fn: (gs: StepGroup[]) => StepGroup[]) => { setGroups(fn); setDirty(true); };
  const patch = (gid: string, p: Partial<StepGroup>) => update((gs) => gs.map((g) => (g.id === gid ? { ...g, ...p } : g)));
  function move(sid: string, to: string) {
    update((gs) => gs.map((g) => {
      const without = g.members.filter((m) => m.studentId !== sid);
      if (g.id === to && !g.members.some((m) => m.studentId === sid)) return { ...g, members: [...without, { studentId: sid, reason: "Giáo viên điều chỉnh", fit: "manual" }] };
      return g.id === to ? g : { ...g, members: without };
    }));
  }
  const body = () => ({ groups: groups.map((g) => ({ id: g.id, name: g.name, competency: g.competency, strengths: g.strengths, difficulties: g.difficulties, needs: g.needs, supportGoal: g.supportGoal, members: g.members })) });
  async function saveDraft() { const r = await save.mutate(`/api/sessions/${id}/review`, "PUT", body()); if (r.ok) setDirty(false); return r.ok; }
  async function refreshProfiles() { if (dirty && !(await saveDraft())) return; await action.mutate(`/api/sessions/${id}/profiles`, "POST"); }
  async function confirm() {
    if (dirty && !(await saveDraft())) return;
    const r = await action.mutate<{ outdatedLessons: number }>(`/api/sessions/${id}/confirm`, "POST", undefined, { refresh: false });
    if (r.ok) { setDirty(false); router.replace(`/phase1/${id}?step=4&confirmed=${r.data.outdatedLessons}`); router.refresh(); }
  }
  const drop = (gid: string) => readOnly ? {} : {
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setOver(gid); },
    onDragLeave: () => setOver((o) => (o === gid ? null : o)),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); setOver(null); const sid = e.dataTransfer.getData("text/plain"); if (sid) move(sid, gid); },
  };

  return (
    <div className="space-y-5">
      {status === "CONFIRMED" && (
        <Alert tone="success" className="flex flex-wrap items-center gap-3">
          <ShieldCheck className="size-5" /><span className="flex-1">Hồ sơ nhóm đã được duyệt — đây là nguồn dữ liệu cho Pha 2. Muốn thay đổi, tạo phiên bản mới (phiên này được giữ nguyên để KHBD cũ truy vết được).</span>
          <Button asChild size="sm"><Link href={`/phase2/new?sessionId=${id}`}>Thiết kế KHBD <ArrowRight /></Link></Button>
        </Alert>
      )}
      {confirmedNote && <Alert tone="success" className="flex items-center gap-2"><CheckCircle2 className="size-5" />{confirmedNote}</Alert>}

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          {groups.map((g, gi) => {
            const members = g.members.map((m) => ({ ...m, s: byId.get(m.studentId) })).filter((m) => m.s);
            const scores = members.map((m) => m.s!.score).filter((x): x is number => x != null);
            const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
            const issue = check.issues.find((i) => i.groupIndex === gi);
            return (
              <Card key={g.id} {...drop(g.id)} className={cn("flex flex-col transition-colors", over === g.id && "border-primary bg-primary-soft/40", issue?.level === "error" && "border-danger/50")}>
                <button type="button" onClick={() => setOpen(g.id)} className="space-y-2 p-4 text-left hover:bg-muted/30" aria-label={`Xem hồ sơ ${g.name}`}>
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">{gi + 1}</span>
                    <span className="flex-1 font-semibold">{g.name}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums">{g.members.length} HS{avg != null ? ` · TB ${f1(avg)}` : ""}</span>
                  </div>
                  <p className="line-clamp-2 text-sm text-slate-600">{g.competency || g.description || "Chưa có mô tả năng lực"}</p>
                  <div className="flex flex-wrap gap-1 text-[11px]">
                    {g.strengths.slice(0, 3).map((x) => <span key={x} className="rounded-full bg-success-soft px-2 py-0.5 text-success">★ {x}</span>)}
                    {g.difficulties.slice(0, 3).map((x) => <span key={x} className="rounded-full bg-warning-soft px-2 py-0.5 text-warning">⚑ {x}</span>)}
                  </div>
                  {g.needs && <p className="line-clamp-2 text-xs text-muted-foreground"><b className="font-medium text-slate-600">Nhu cầu:</b> {g.needs}</p>}
                  {issue && <p className={cn("text-xs", issue.level === "error" ? "text-danger" : "text-warning")}>{issue.message}</p>}
                </button>
                <ul className="flex min-h-14 flex-1 flex-wrap content-start gap-1.5 border-t p-3">
                  {members.map((m) => (
                    <li key={m.studentId} draggable={!readOnly} onDragStart={(e) => e.dataTransfer.setData("text/plain", m.studentId)} title={m.reason ?? ""}
                      className={cn("flex items-center gap-1 rounded-full border bg-card py-0.5 pl-0.5 pr-2 text-xs", !readOnly && "cursor-grab active:cursor-grabbing", m.fit === "manual" && "border-warning/50")}>
                      <span className="flex size-5 items-center justify-center rounded-full bg-slate-100 text-[9px] font-semibold">{initials(m.s!.fullName)}</span>
                      {m.s!.fullName}{m.s!.score != null && <span className="text-muted-foreground"> {f1(m.s!.score)}</span>}
                    </li>
                  ))}
                  {!members.length && <li className="w-full rounded border border-dashed p-2 text-center text-xs text-muted-foreground">{readOnly ? "Không có thành viên" : "Kéo học sinh vào đây"}</li>}
                </ul>
              </Card>
            );
          })}
          {(outside.length > 0 || !readOnly) && (
            <Card {...drop(OUT)} className={cn("p-3 md:col-span-2", over === OUT && "border-primary bg-primary-soft/40")}>
              <p className="mb-2 text-sm font-medium">Chưa xếp nhóm ({outside.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {outside.map((s) => <span key={s.id} draggable={!readOnly} onDragStart={(e) => e.dataTransfer.setData("text/plain", s.id)} className="cursor-grab rounded-full border px-2 py-0.5 text-xs">{s.fullName}</span>)}
                {!outside.length && <span className="text-xs text-muted-foreground">Kéo học sinh vào đây để bỏ khỏi nhóm (ví dụ vắng dài ngày).</span>}
              </div>
            </Card>
          )}
        </div>
        <div className="space-y-3 lg:sticky lg:top-20 lg:self-start">
          <CheckPanel fitRate={check.fitRate} issues={check.issues} compact />
          {!readOnly && <p className="text-xs text-muted-foreground">Kéo thả học sinh giữa các thẻ, hoặc bấm vào thẻ để xem hồ sơ chi tiết và chuyển nhóm. Kiểm tra chạy lại ngay sau mỗi thay đổi.</p>}
        </div>
      </div>

      {(save.error || action.error) && <Alert tone="danger">{save.error ?? action.error}</Alert>}
      {!readOnly && (
        <StepFooter hint={dirty ? <span className="text-warning">Có thay đổi chưa lưu.</span> : "Xác nhận sẽ lưu Hồ sơ nhóm (Learning Group Profiles) làm đầu vào cho Pha 2."}>
          <Button variant="outline" onClick={saveDraft} disabled={save.pending || !dirty}>{save.pending ? <Loader2 className="animate-spin" /> : <Save />} Lưu nháp</Button>
          <Button variant="outline" onClick={refreshProfiles} disabled={action.pending} title="Tổng hợp lại đặc trưng năng lực, điểm mạnh, khó khăn từ thành viên hiện tại"><RefreshCw /> Tổng hợp lại hồ sơ</Button>
          <Button onClick={confirm} disabled={action.pending || check.issues.some((i) => i.level === "error")}>{action.pending ? <Loader2 className="animate-spin" /> : <ShieldCheck />} Xác nhận & lưu hồ sơ nhóm</Button>
        </StepFooter>
      )}

      <Sheet open={!!current} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent side="right" className="w-[34rem] overflow-y-auto" aria-describedby={undefined}>
          {current && (
            <div className="space-y-4 p-5">
              <SheetTitle className="pr-8 text-lg font-semibold">Hồ sơ nhóm: {current.name}</SheetTitle>
              <div className="space-y-1"><label htmlFor="g-name" className="text-xs font-medium text-muted-foreground">Tên nhóm</label><Input id="g-name" disabled={readOnly} value={current.name} onChange={(e) => patch(current.id, { name: e.target.value })} /></div>
              {current.description && <p className="rounded-lg bg-muted/50 p-2.5 text-xs"><b>Mô tả của giáo viên:</b> {current.description}</p>}
              <div className="space-y-1"><label htmlFor="g-comp" className="text-xs font-medium text-muted-foreground">Đặc trưng năng lực</label><Textarea id="g-comp" rows={2} disabled={readOnly} value={current.competency ?? ""} onChange={(e) => patch(current.id, { competency: e.target.value })} /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1"><label htmlFor="g-str" className="text-xs font-medium text-muted-foreground">Điểm mạnh</label>{readOnly ? <p className="text-sm">{current.strengths.join(", ") || "—"}</p> : <TagInput id="g-str" value={current.strengths} onChange={(v) => patch(current.id, { strengths: v })} tone="success" />}</div>
                <div className="space-y-1"><label htmlFor="g-dif" className="text-xs font-medium text-muted-foreground">Khó khăn</label>{readOnly ? <p className="text-sm">{current.difficulties.join(", ") || "—"}</p> : <TagInput id="g-dif" value={current.difficulties} onChange={(v) => patch(current.id, { difficulties: v })} tone="warning" />}</div>
              </div>
              <div className="space-y-1"><label htmlFor="g-needs" className="text-xs font-medium text-muted-foreground">Nhu cầu học tập</label><Textarea id="g-needs" rows={2} disabled={readOnly} value={current.needs ?? ""} onChange={(e) => patch(current.id, { needs: e.target.value })} /></div>
              <div className="space-y-1"><label htmlFor="g-goal" className="text-xs font-medium text-muted-foreground">Mục tiêu hỗ trợ</label><Textarea id="g-goal" rows={2} disabled={readOnly} value={current.supportGoal ?? ""} onChange={(e) => patch(current.id, { supportGoal: e.target.value })} /></div>
              <div>
                <p className="mb-2 text-sm font-semibold">Thành viên ({current.members.length})</p>
                <ul className="space-y-2">
                  {current.members.map((m) => {
                    const s = byId.get(m.studentId);
                    if (!s) return null;
                    return (
                      <li key={m.studentId} className="rounded-lg border p-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex-1 text-sm font-medium">{s.fullName}{s.score != null && <span className="ml-1 text-xs font-normal text-muted-foreground">· TB {f1(s.score)}</span>}</span>
                          {fitBadge(m.fit)}
                          {!readOnly && (
                            <select aria-label={`Chuyển ${s.fullName}`} value={current.id} onChange={(e) => move(s.id, e.target.value)} className="h-7 rounded border bg-card px-1 text-xs">
                              {groups.map((g) => <option key={g.id} value={g.id}>{g.id === current.id ? "Chuyển nhóm…" : `→ ${g.name}`}</option>)}
                              <option value={OUT}>→ Bỏ khỏi nhóm</option>
                            </select>
                          )}
                        </div>
                        <TraitChips interests={s.interests} strengths={s.strengths} needs={s.needs} className="mt-1" />
                        {m.reason && <p className="mt-1 text-xs text-muted-foreground">{m.reason}</p>}
                      </li>
                    );
                  })}
                </ul>
              </div>
              {!readOnly && <p className="text-xs text-muted-foreground">Thay đổi được giữ ở bản nháp — bấm “Lưu nháp” hoặc “Xác nhận”.</p>}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
