"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, Download, GripVertical, Loader2, Plus, Printer, Save, Shuffle, Trash2, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { TraitChips } from "@/components/students/trait-chips";
import { useMutation } from "@/hooks/use-mutation";
import { describeRange } from "@/lib/grouping/match";
import { emptyGroup } from "@/lib/grouping/presets";
import { cn } from "@/lib/utils";
import { GroupSpecFields, type SpecDraft } from "./group-spec-fields";

export type EditorStudent = { id: string; fullName: string; interests: string[]; strengths: string[]; needs: string[]; score: number | null };
type Member = { studentId: string; reason: string | null };
type EGroup = SpecDraft & { members: Member[]; taskCount: number };
type Sheet = { id: string; subject: string; fileName: string };

const UNASSIGNED = "__unassigned__";
let seq = 0;
const newKey = () => `g${++seq}`;
const f1 = (x: number | null) => (x == null ? null : (Math.round(x * 10) / 10).toString().replace(".", ","));

export function GroupingEditor({
  id, classId, initial, students: initialStudents, sheets, keywordSuggestions, lessonCount,
}: {
  id: string;
  classId: string;
  initial: { title: string; subject: string | null; scoreSheetId: string | null; balanceSizes: boolean; groups: (Omit<EGroup, "key">)[] };
  students: EditorStudent[];
  sheets: Sheet[];
  keywordSuggestions: string[];
  lessonCount: number;
}) {
  const router = useRouter();
  const [students, setStudents] = useState(initialStudents);
  const byId = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);
  const [title, setTitle] = useState(initial.title);
  const [subject, setSubject] = useState(initial.subject ?? "");
  const [sheetId, setSheetId] = useState(initial.scoreSheetId ?? "");
  const [balance, setBalance] = useState(initial.balanceSizes);
  const [groups, setGroups] = useState<EGroup[]>(() => initial.groups.map((g) => ({ ...g, key: newKey() })));
  const [openSpec, setOpenSpec] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const save = useMutation();
  const assign = useMutation();
  const del = useMutation();

  const assigned = new Set(groups.flatMap((g) => g.members.map((m) => m.studentId)));
  const unassigned = students.filter((s) => !assigned.has(s.id));

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const update = (fn: (gs: EGroup[]) => EGroup[]) => { setGroups(fn); setDirty(true); };
  const patch = (key: string, p: Partial<EGroup>) => update((gs) => gs.map((g) => (g.key === key ? { ...g, ...p } : g)));

  function move(studentId: string, toKey: string) {
    update((gs) => gs.map((g) => {
      const without = g.members.filter((m) => m.studentId !== studentId);
      if (g.key === toKey && !g.members.some((m) => m.studentId === studentId)) return { ...g, members: [...without, { studentId, reason: "Giáo viên điều chỉnh" }] };
      return g.key === toKey ? g : { ...g, members: without };
    }));
  }

  const specs = () => groups.map(({ name, profile, keywords, scoreMin, scoreMax, forSupport }) => ({ name, profile, keywords, scoreMin, scoreMax, forSupport }));

  async function reassign() {
    const ids = groups.flatMap((g) => g.members.map((m) => m.studentId));
    const res = await assign.mutate<{ assignment: { studentId: string; groupIndex: number; reason: string }[]; scores: Record<string, number | null> }>(
      `/api/groupings/${id}/assign`, "POST", { scoreSheetId: sheetId || null, balanceSizes: balance, groups: specs(), studentIds: ids }, { refresh: false });
    if (!res.ok) return;
    setStudents((ss) => ss.map((s) => ({ ...s, score: res.data.scores[s.id] ?? null })));
    update((gs) => gs.map((g, gi) => ({ ...g, members: res.data.assignment.filter((a) => a.groupIndex === gi).map((a) => ({ studentId: a.studentId, reason: a.reason })) })));
  }

  async function onSave() {
    const res = await save.mutate(`/api/groupings/${id}`, "PUT", {
      title, subject: subject || null, scoreSheetId: sheetId || null, balanceSizes: balance,
      groups: groups.map((g) => ({ id: g.id, name: g.name, profile: g.profile, keywords: g.keywords, scoreMin: g.scoreMin, scoreMax: g.scoreMax, forSupport: g.forSupport, members: g.members })),
    });
    if (res.ok) setDirty(false);
  }

  function removeGroup(g: EGroup) {
    if (g.taskCount > 0 && !window.confirm(`${g.name} đang có ${g.taskCount} nhiệm vụ trong các KHBD. Xóa nhóm sẽ xóa luôn các nhiệm vụ đó khi lưu. Tiếp tục?`)) return;
    update((gs) => gs.filter((x) => x.key !== g.key));
  }

  const dropProps = (key: string) => ({
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setDragOver(key); },
    onDragLeave: () => setDragOver((k) => (k === key ? null : k)),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); setDragOver(null); const sid = e.dataTransfer.getData("text/plain"); if (sid) move(sid, key); },
  });

  const memberCard = (s: EditorStudent, reason: string | null, currentKey: string) => (
    <li key={s.id} draggable onDragStart={(e) => { e.dataTransfer.setData("text/plain", s.id); e.dataTransfer.effectAllowed = "move"; }}
      className="flex cursor-grab items-start gap-1.5 rounded-md border bg-card p-2 active:cursor-grabbing print:cursor-auto print:border-0 print:p-0.5">
      <GripVertical className="mt-0.5 size-4 shrink-0 text-muted-foreground print:hidden" />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="flex items-baseline gap-1.5 text-sm font-medium">
          {s.fullName}
          {s.score != null && <span className="rounded bg-muted px-1 text-[11px] font-normal tabular-nums text-muted-foreground" title="Điểm trung bình theo hệ số">{f1(s.score)}</span>}
        </p>
        <TraitChips interests={s.interests} strengths={s.strengths} needs={s.needs} className="print:hidden" />
        {reason && <p className={cn("text-xs", reason.startsWith("Phù hợp") ? "text-success" : "text-muted-foreground")}>{reason}</p>}
      </div>
      <select aria-label={`Chuyển ${s.fullName} sang nhóm`} title="Chuyển nhóm" value={currentKey} onChange={(e) => move(s.id, e.target.value)}
        className="w-6 shrink-0 cursor-pointer appearance-none rounded border-0 bg-transparent text-center text-xs text-muted-foreground hover:bg-muted print:hidden">
        <option value={currentKey} disabled>⇄</option>
        {groups.filter((g) => g.key !== currentKey).map((g) => <option key={g.key} value={g.key}>→ {g.name}</option>)}
        {currentKey !== UNASSIGNED && <option value={UNASSIGNED}>→ Bỏ ra ngoài</option>}
      </select>
    </li>
  );

  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-4 print:hidden">
        <div className="grid gap-3 md:grid-cols-[2fr_1fr_1.5fr_auto] md:items-end">
          <div className="space-y-1"><label htmlFor="title" className="text-sm font-medium">Tên bộ nhóm</label>
            <Input id="title" value={title} onChange={(e) => { setTitle(e.target.value); setDirty(true); }} /></div>
          <div className="space-y-1"><label htmlFor="subject" className="text-sm font-medium">Môn</label>
            <Input id="subject" value={subject} onChange={(e) => { setSubject(e.target.value); setDirty(true); }} /></div>
          <div className="space-y-1"><label htmlFor="sheet" className="text-sm font-medium">Bảng điểm</label>
            <Select id="sheet" value={sheetId} onChange={(e) => { setSheetId(e.target.value); setDirty(true); }}>
              <option value="">Không dùng điểm</option>
              {sheets.map((s) => <option key={s.id} value={s.id}>{s.subject} — {s.fileName}</option>)}
            </Select></div>
          <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" checked={balance} onChange={(e) => { setBalance(e.target.checked); setDirty(true); }} /> Cân bằng sĩ số</label>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
          <Button onClick={onSave} disabled={save.pending || !dirty}>{save.pending ? <Loader2 className="animate-spin" /> : <Save />} {dirty ? "Lưu" : "Đã lưu"}</Button>
          <Button variant="secondary" onClick={reassign} disabled={assign.pending || assigned.size < 1} title="Xếp lại toàn bộ học sinh theo đặc trưng nhóm hiện tại (chưa lưu)">
            {assign.pending ? <Loader2 className="animate-spin" /> : <Shuffle />} Xếp lại theo đặc trưng
          </Button>
          <Button variant="outline" disabled={groups.length >= 12} onClick={() => { const g = { ...emptyGroup(groups.length), key: newKey(), members: [], taskCount: 0 }; update((gs) => [...gs, g]); setOpenSpec(g.key); }}><Plus /> Thêm nhóm</Button>
          <Button asChild={!dirty} variant="outline" disabled={dirty} title={dirty ? "Lưu trước khi xuất" : undefined}>
            {dirty ? <span><Download /> Xuất Excel</span> : <a href={`/api/groupings/${id}/export`} download><Download /> Xuất Excel</a>}
          </Button>
          <Button variant="outline" onClick={() => window.print()}><Printer /> In</Button>
          <ConfirmButton variant="ghost" className="text-danger" title="Xóa bộ nhóm này?" confirmLabel="Xóa"
            description={lessonCount ? `${lessonCount} KHBD đang dùng bộ nhóm này cũng sẽ bị xóa. Thao tác không thể hoàn tác.` : "Thao tác không thể hoàn tác."}
            onConfirm={async () => { const r = await del.mutate(`/api/groupings/${id}`, "DELETE", undefined, { refresh: false }); if (r.ok) { setDirty(false); router.push(`/classes/${classId}/groups`); router.refresh(); } return r; }}>
            <Trash2 /> Xóa
          </ConfirmButton>
          <div className="flex-1" />
          <Button asChild={!dirty} disabled={dirty} title={dirty ? "Lưu bộ nhóm trước" : undefined}>
            {dirty ? <span>Pha 2: Soạn KHBD <ArrowRight /></span> : <Link href={`/classes/${classId}/lessons/new?groupingId=${id}`}>Pha 2: Soạn KHBD <ArrowRight /></Link>}
          </Button>
        </div>
        {(save.error || assign.error) && <Alert tone="danger">{save.error ?? assign.error}</Alert>}
        {dirty && <p className="text-xs text-warning">Có thay đổi chưa lưu. Sửa đặc trưng nhóm xong, bấm “Xếp lại theo đặc trưng” để hệ thống xếp lại học sinh.</p>}
      </Card>

      <h1 className="hidden text-xl font-semibold print:block">{title}</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 print:grid-cols-2 print:gap-2">
        {groups.map((g, gi) => {
          const members = g.members.map((m) => ({ s: byId.get(m.studentId), reason: m.reason })).filter((x) => x.s);
          const range = describeRange(g);
          const scores = members.map((x) => x.s!.score).filter((x): x is number => x != null);
          return (
            <Card key={g.key} {...dropProps(g.key)} className={cn("flex flex-col gap-2 p-3 transition-colors print:break-inside-avoid print:shadow-none", dragOver === g.key && "border-primary bg-primary-soft/40")}>
              <div className="flex items-center gap-1">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">{gi + 1}</span>
                <Input aria-label={`Tên nhóm ${gi + 1}`} value={g.name} onChange={(e) => patch(g.key, { name: e.target.value })}
                  className="h-8 border-transparent px-1 font-semibold hover:border-border focus:border-border print:hidden" />
                <span className="hidden font-semibold print:block">{g.name}</span>
                <span className="shrink-0 rounded-full bg-muted px-2 text-xs tabular-nums" title="Sĩ số">{g.members.length}</span>
                <button type="button" aria-label={`Xóa ${g.name}`} onClick={() => removeGroup(g)} disabled={groups.length <= 1} className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30 print:hidden"><X className="size-4" /></button>
              </div>
              {g.profile && <p className="text-sm text-slate-600">{g.profile}</p>}
              <div className="flex flex-wrap gap-1 text-[11px]">
                {g.keywords.map((kw) => <span key={kw} className="rounded-full bg-success-soft px-2 py-0.5 text-success">{kw}</span>)}
                {range && <span className="rounded-full bg-info-soft px-2 py-0.5 text-info">Điểm {range}</span>}
                {g.forSupport && <span className="rounded-full bg-warning-soft px-2 py-0.5 text-warning">Nhóm hỗ trợ</span>}
                {scores.length > 0 && <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">TB nhóm {f1(scores.reduce((a, b) => a + b, 0) / scores.length)}</span>}
              </div>
              <button type="button" onClick={() => setOpenSpec(openSpec === g.key ? null : g.key)} aria-expanded={openSpec === g.key}
                className="flex items-center gap-1 self-start text-xs font-medium text-primary hover:underline print:hidden">
                <ChevronDown className={cn("size-3.5 transition-transform", openSpec === g.key && "rotate-180")} /> Sửa đặc trưng nhóm
              </button>
              {openSpec === g.key && (
                <div className="rounded-lg border bg-muted/30 p-3 print:hidden">
                  <GroupSpecFields compact g={g} onChange={(p) => patch(g.key, p)} keywordSuggestions={keywordSuggestions} hasScores={!!sheetId} />
                </div>
              )}
              <ul className="flex min-h-12 flex-col gap-1.5">
                {members.map(({ s, reason }) => memberCard(s!, reason, g.key))}
                {!members.length && <li className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">Kéo học sinh vào đây</li>}
              </ul>
            </Card>
          );
        })}
      </div>

      <Card {...dropProps(UNASSIGNED)} className={cn("p-3 print:hidden", dragOver === UNASSIGNED && "border-primary bg-primary-soft/40")}>
        <p className="mb-2 text-sm font-medium">Chưa xếp nhóm ({unassigned.length})</p>
        {unassigned.length ? <ul className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">{unassigned.map((s) => memberCard(s, null, UNASSIGNED))}</ul>
          : <p className="text-xs text-muted-foreground">Tất cả học sinh đã có nhóm. Kéo học sinh vào đây để bỏ ra khỏi nhóm (ví dụ vắng mặt).</p>}
      </Card>
    </div>
  );
}
