"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Shuffle, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { useMutation } from "@/hooks/use-mutation";
import { GROUP_PRESETS, emptyGroup } from "@/lib/grouping/presets";
import { cn } from "@/lib/utils";
import { GroupSpecFields, type SpecDraft } from "./group-spec-fields";

type Sheet = { id: string; subject: string; fileName: string };
let seq = 0;
const k = () => `n${++seq}`;

export function NewGroupingForm({
  classId, students, sheets, keywordSuggestions,
}: {
  classId: string;
  students: { id: string; fullName: string }[];
  sheets: Sheet[];
  keywordSuggestions: string[];
}) {
  const router = useRouter();
  const [preset, setPreset] = useState(GROUP_PRESETS[0].id);
  const [groups, setGroups] = useState<SpecDraft[]>(() => GROUP_PRESETS[0].groups.map((g) => ({ ...g, keywords: [...g.keywords], key: k() })));
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [sheetId, setSheetId] = useState(sheets[0]?.id ?? "");
  const [balance, setBalance] = useState(true);
  const [absent, setAbsent] = useState<string[]>([]);
  const { mutate, pending, error, fieldError } = useMutation();

  const usesScores = groups.some((g) => g.scoreMin != null || g.scoreMax != null);

  function applyPreset(id: string) {
    setPreset(id);
    const p = GROUP_PRESETS.find((x) => x.id === id);
    setGroups(p ? p.groups.map((g) => ({ ...g, keywords: [...g.keywords], key: k() })) : [emptyGroup(0), emptyGroup(1), emptyGroup(2)].map((g) => ({ ...g, key: k() })));
  }
  const patch = (key: string, p: Partial<SpecDraft>) => setGroups((gs) => gs.map((g) => (g.key === key ? { ...g, ...p } : g)));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await mutate<{ id: string }>("/api/groupings", "POST", {
      classId, title, subject: subject || null, scoreSheetId: sheetId || null, balanceSizes: balance, excludeStudentIds: absent,
      groups: groups.map(({ name, profile, keywords, scoreMin, scoreMax, forSupport }) => ({ name, profile, keywords, scoreMin, scoreMax, forSupport })),
    }, { refresh: false });
    if (res.ok) { router.push(`/classes/${classId}/groups/${res.data.id}`); router.refresh(); }
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <Card className="grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Tên bộ nhóm" htmlFor="title" required error={fieldError("title")} hint="Bộ nhóm sẽ được dùng lại cho nhiều KHBD ở Pha 2">
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ví dụ: Nhóm Ngữ văn – Học kỳ I" />
        </Field>
        <Field label="Môn học" htmlFor="subject">
          <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ví dụ: Ngữ văn" />
        </Field>
        <Field label="Bảng điểm dùng để xếp" htmlFor="sheet" error={fieldError("scoreSheetId")} hint={usesScores ? "Bắt buộc vì có nhóm đặt khoảng điểm" : "Chỉ cần khi nhóm có khoảng điểm"}>
          <Select id="sheet" value={sheetId} onChange={(e) => setSheetId(e.target.value)}>
            <option value="">Không dùng điểm</option>
            {sheets.map((s) => <option key={s.id} value={s.id}>{s.subject} — {s.fileName}</option>)}
          </Select>
        </Field>
        <label className="flex items-start gap-2 self-center text-sm">
          <input type="checkbox" className="mt-0.5" checked={balance} onChange={(e) => setBalance(e.target.checked)} />
          <span>Giữ sĩ số các nhóm gần bằng nhau<br /><span className="text-xs text-muted-foreground">Bỏ chọn: mỗi em vào nhóm phù hợp nhất, sĩ số theo thực tế</span></span>
        </label>
      </Card>

      <Card className="space-y-4 p-5">
        <div>
          <h2 className="font-semibold">Số nhóm và đặc trưng từng nhóm</h2>
          <p className="text-sm text-muted-foreground">Chọn bộ mẫu rồi sửa, hoặc tự định nghĩa. Hệ thống xếp mỗi học sinh vào nhóm có đặc trưng phù hợp nhất và ghi lý do.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4" role="radiogroup" aria-label="Bộ đặc trưng mẫu">
          {[...GROUP_PRESETS, { id: "custom", label: "Tự định nghĩa", description: "Bắt đầu từ 3 nhóm trống.", groups: [] }].map((p) => (
            <button key={p.id} type="button" role="radio" aria-checked={preset === p.id} onClick={() => applyPreset(p.id)}
              className={cn("rounded-lg border p-3 text-left transition-colors hover:border-primary/40", preset === p.id && "border-primary bg-primary-soft ring-1 ring-primary")}>
              <p className="text-sm font-medium">{p.label}</p>
              <p className="text-xs text-muted-foreground">{p.description}</p>
            </button>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {groups.map((g, i) => (
            <div key={g.key} className="relative rounded-lg border p-4">
              <span className="absolute -left-2 -top-2 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{i + 1}</span>
              <button type="button" aria-label={`Xóa ${g.name}`} disabled={groups.length <= 2} onClick={() => setGroups((gs) => gs.filter((x) => x.key !== g.key))}
                className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"><X className="size-4" /></button>
              <GroupSpecFields g={g} onChange={(p) => patch(g.key, p)} keywordSuggestions={keywordSuggestions} hasScores={!!sheetId} />
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" disabled={groups.length >= 12} onClick={() => setGroups((gs) => [...gs, { ...emptyGroup(gs.length), key: k() }])}>
          <Plus /> Thêm nhóm ({groups.length} nhóm)
        </Button>
      </Card>

      <Card className="space-y-2 p-5">
        <h2 className="font-semibold">Học sinh vắng / không tham gia</h2>
        <p className="text-sm text-muted-foreground">Bỏ chọn các em không xếp lần này (có thể thêm lại sau).</p>
        <div className="flex flex-wrap gap-1.5">
          {students.map((s) => {
            const out = absent.includes(s.id);
            return (
              <button key={s.id} type="button" aria-pressed={!out} onClick={() => setAbsent((a) => (out ? a.filter((x) => x !== s.id) : [...a, s.id]))}
                className={cn("rounded-full border px-2.5 py-1 text-xs", out ? "border-dashed text-muted-foreground line-through" : "bg-card")}>{s.fullName}</button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">{students.length - absent.length} học sinh sẽ được xếp vào {groups.length} nhóm.</p>
      </Card>

      {error && <Alert tone="danger">{error}</Alert>}
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : <Shuffle />} Xếp học sinh vào {groups.length} nhóm</Button>
      </div>
    </form>
  );
}
