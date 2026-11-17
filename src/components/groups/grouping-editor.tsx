"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, GripVertical, Loader2, Plus, Printer, Save, Shuffle, Trash2, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { TraitChips } from "@/components/students/trait-chips";
import { useMutation } from "@/hooks/use-mutation";
import { cn } from "@/lib/utils";
import { METHOD_INFO, type Method } from "./methods";

export type EditorStudent = { id: string; fullName: string; interests: string[]; strengths: string[]; needs: string[] };
type Member = { studentId: string; reason: string | null };
type EGroup = { key: string; name: string; task: string | null; members: Member[] };

const UNASSIGNED = "__unassigned__";
let keySeq = 0;
const newKey = () => `g${++keySeq}`;

export function GroupingEditor({
  id, initialTitle, method: initialMethod, className, students, initialGroups,
}: {
  id: string;
  initialTitle: string;
  method: Method;
  className: string;
  students: EditorStudent[];
  initialGroups: { name: string; task: string | null; members: Member[] }[];
}) {
  const router = useRouter();
  const byId = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);
  const [title, setTitle] = useState(initialTitle);
  const [groups, setGroups] = useState<EGroup[]>(() => initialGroups.map((g) => ({ ...g, key: newKey() })));
  const [method, setMethod] = useState<Method>(initialMethod);
  const [appliedMethod, setAppliedMethod] = useState<Method>(initialMethod); // cách chia của kết quả đang hiển thị
  const [count, setCount] = useState(initialGroups.length || 4);
  const [dirty, setDirty] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const save = useMutation();
  const suggest = useMutation();
  const del = useMutation();

  const assigned = new Set(groups.flatMap((g) => g.members.map((m) => m.studentId)));
  const unassigned = students.filter((s) => !assigned.has(s.id));

  // Cảnh báo khi rời trang mà chưa lưu
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const update = (fn: (gs: EGroup[]) => EGroup[]) => { setGroups(fn); setDirty(true); };

  /** Chuyển học sinh sang nhóm khác (hoặc ra ngoài) — lý do cũ không còn đúng nên ghi lại là "Giáo viên điều chỉnh" */
  function move(studentId: string, toKey: string) {
    update((gs) => {
      const from = gs.find((g) => g.members.some((m) => m.studentId === studentId));
      if (from?.key === toKey) return gs;
      return gs.map((g) => {
        const without = g.members.filter((m) => m.studentId !== studentId);
        if (g.key === toKey) return { ...g, members: [...without, { studentId, reason: "Giáo viên điều chỉnh" }] };
        return { ...g, members: without };
      });
    });
  }

  async function resuggest() {
    const ids = groups.flatMap((g) => g.members.map((m) => m.studentId));
    const res = await suggest.mutate<{ name: string; task: string | null; members: Member[] }[]>(
      `/api/groupings/${id}/suggest`, "POST",
      { method, groupCount: count, studentIds: ids, seed: Math.floor(Math.random() * 1e9) },
      { refresh: false },
    );
    if (res.ok) {
      // Giữ nhiệm vụ đã nhập theo thứ tự nhóm
      update((old) => res.data.map((g, i) => ({ ...g, key: newKey(), task: old[i]?.task ?? g.task })));
      setAppliedMethod(method);
    }
  }

  async function onSave() {
    const res = await save.mutate(`/api/groupings/${id}`, "PUT", {
      title,
      method: appliedMethod,
      groups: groups.map((g) => ({ name: g.name, task: g.task, members: g.members })),
    });
    if (res.ok) setDirty(false);
  }

  const dropProps = (key: string) => ({
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setDragOver(key); },
    onDragLeave: () => setDragOver((k) => (k === key ? null : k)),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(null);
      const sid = e.dataTransfer.getData("text/plain");
      if (sid) move(sid, key);
    },
  });

  const memberCard = (s: EditorStudent, reason: string | null, currentKey: string) => (
    <li
      key={s.id}
      draggable
      onDragStart={(e) => { e.dataTransfer.setData("text/plain", s.id); e.dataTransfer.effectAllowed = "move"; }}
      className="group/m flex cursor-grab items-start gap-1.5 rounded-md border bg-card p-2 active:cursor-grabbing print:cursor-auto print:border-0 print:p-0.5"
    >
      <GripVertical className="mt-0.5 size-4 shrink-0 text-muted-foreground print:hidden" />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium">{s.fullName}</p>
        <TraitChips interests={s.interests} strengths={s.strengths} needs={s.needs} className="print:hidden" />
        {reason && <p className="text-xs text-muted-foreground">{reason}</p>}
      </div>
      <select
        aria-label={`Chuyển ${s.fullName} sang nhóm`}
        value={currentKey}
        onChange={(e) => move(s.id, e.target.value)}
        className="w-6 shrink-0 cursor-pointer appearance-none rounded border-0 bg-transparent text-center text-xs text-muted-foreground hover:bg-muted print:hidden"
        title="Chuyển nhóm"
      >
        <option value={currentKey} disabled>⇄</option>
        {groups.filter((g) => g.key !== currentKey).map((g) => <option key={g.key} value={g.key}>→ {g.name}</option>)}
        {currentKey !== UNASSIGNED && <option value={UNASSIGNED}>→ Bỏ ra ngoài</option>}
      </select>
    </li>
  );

  const sizes = groups.map((g) => g.members.length);

  return (
    <div className="space-y-4">
      {/* Thanh công cụ */}
      <Card className="space-y-3 p-4 print:hidden">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1 space-y-1">
            <label htmlFor="title" className="text-sm font-medium">Bài học / hoạt động · Lớp {className}</label>
            <Input id="title" value={title} onChange={(e) => { setTitle(e.target.value); setDirty(true); }} />
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <label htmlFor="method" className="text-sm font-medium">Cách chia</label>
              <Select id="method" value={method} onChange={(e) => setMethod(e.target.value as Method)} className="w-44">
                {(Object.keys(METHOD_INFO) as Method[]).map((m) => <option key={m} value={m}>{METHOD_INFO[m].label}</option>)}
              </Select>
            </div>
            <div className="space-y-1">
              <label htmlFor="count" className="text-sm font-medium">Số nhóm</label>
              <Input id="count" type="number" min={2} max={20} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-20" />
            </div>
            <Button variant="secondary" onClick={resuggest} disabled={suggest.pending || assigned.size < 2}>
              {suggest.pending ? <Loader2 className="animate-spin" /> : <Shuffle />} Gợi ý lại
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
          <Button onClick={onSave} disabled={save.pending || !dirty}>{save.pending ? <Loader2 className="animate-spin" /> : <Save />} {dirty ? "Lưu" : "Đã lưu"}</Button>
          <Button variant="outline" onClick={() => update((gs) => [...gs, { key: newKey(), name: `Nhóm ${gs.length + 1}`, task: null, members: [] }])} disabled={groups.length >= 20}><Plus /> Thêm nhóm</Button>
          <Button asChild={!dirty} variant="outline" disabled={dirty} title={dirty ? "Lưu trước khi xuất" : undefined}>
            {dirty ? <span><Download /> Xuất Excel</span> : <a href={`/api/groupings/${id}/export`} download><Download /> Xuất Excel</a>}
          </Button>
          <Button variant="outline" onClick={() => window.print()}><Printer /> In</Button>
          <span className="text-xs text-muted-foreground">Kéo thả học sinh giữa các nhóm, hoặc dùng nút ⇄. Sĩ số: {sizes.join(" · ")}</span>
          <div className="flex-1" />
          <ConfirmButton variant="ghost" className="text-danger" title="Xóa kết quả chia nhóm này?" description="Thao tác không thể hoàn tác." confirmLabel="Xóa"
            onConfirm={async () => {
              const r = await del.mutate(`/api/groupings/${id}`, "DELETE", undefined, { refresh: false });
              if (r.ok) { setDirty(false); router.push("/groups"); router.refresh(); }
              return r;
            }}>
            <Trash2 /> Xóa
          </ConfirmButton>
        </div>
        {(save.error || suggest.error) && <Alert tone="danger">{save.error ?? suggest.error}</Alert>}
        {dirty && <p className="text-xs text-warning">Có thay đổi chưa lưu.</p>}
      </Card>

      <h1 className="hidden text-xl font-semibold print:block">{title} — Lớp {className}</h1>

      {/* Các nhóm */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 print:grid-cols-3 print:gap-2">
        {groups.map((g, gi) => {
          const members = g.members.map((m) => ({ s: byId.get(m.studentId), reason: m.reason })).filter((x) => x.s);
          const strengths = [...new Set(members.flatMap((x) => x.s!.strengths))];
          const needCount = members.filter((x) => x.s!.needs.length).length;
          return (
            <Card key={g.key} {...dropProps(g.key)}
              className={cn("flex flex-col gap-2 p-3 transition-colors print:break-inside-avoid print:shadow-none", dragOver === g.key && "border-primary bg-primary-soft/40")}>
              <div className="flex items-center gap-1">
                <Input aria-label={`Tên nhóm ${gi + 1}`} value={g.name} onChange={(e) => update((gs) => gs.map((x) => (x.key === g.key ? { ...x, name: e.target.value } : x)))}
                  className="h-8 border-transparent px-1 font-semibold hover:border-border focus:border-border print:hidden" />
                <span className="hidden font-semibold print:block">{g.name}</span>
                <span className="shrink-0 rounded-full bg-muted px-2 text-xs tabular-nums">{g.members.length}</span>
                <button type="button" aria-label={`Xóa ${g.name}`} title="Xóa nhóm (học sinh chuyển ra ngoài)"
                  onClick={() => update((gs) => gs.filter((x) => x.key !== g.key))} className="rounded p-1 text-muted-foreground hover:bg-muted print:hidden">
                  <X className="size-4" />
                </button>
              </div>
              <Textarea aria-label={`Nhiệm vụ ${g.name}`} rows={2} placeholder="Nhiệm vụ / vai trò của nhóm (tùy chọn)" value={g.task ?? ""}
                onChange={(e) => update((gs) => gs.map((x) => (x.key === g.key ? { ...x, task: e.target.value || null } : x)))} className="min-h-0 text-sm print:hidden" />
              {g.task && <p className="hidden text-sm italic print:block">{g.task}</p>}
              <p className="text-xs text-muted-foreground print:hidden">
                {strengths.length ? `Thế mạnh: ${strengths.slice(0, 5).join(", ")}${strengths.length > 5 ? "…" : ""}` : "Chưa có thế mạnh nào"}
                {needCount > 0 && ` · ${needCount} bạn cần hỗ trợ`}
              </p>
              <ul className="flex min-h-12 flex-col gap-1.5">
                {members.map(({ s, reason }) => memberCard(s!, reason, g.key))}
                {!members.length && <li className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">Kéo học sinh vào đây</li>}
              </ul>
            </Card>
          );
        })}
      </div>

      {/* Học sinh chưa xếp nhóm (vắng hoặc mới thêm vào lớp) */}
      <Card {...dropProps(UNASSIGNED)} className={cn("p-3 print:hidden", dragOver === UNASSIGNED && "border-primary bg-primary-soft/40")}>
        <p className="mb-2 text-sm font-medium">Chưa xếp nhóm ({unassigned.length})</p>
        {unassigned.length ? (
          <ul className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">{unassigned.map((s) => memberCard(s, null, UNASSIGNED))}</ul>
        ) : (
          <p className="text-xs text-muted-foreground">Tất cả học sinh đã có nhóm. Kéo học sinh vào đây để bỏ ra khỏi nhóm (ví dụ vắng mặt).</p>
        )}
      </Card>
    </div>
  );
}
