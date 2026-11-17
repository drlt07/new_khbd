"use client";
import { useState } from "react";
import { Loader2, Sparkles, UserPlus } from "lucide-react";
import type { EvidenceType } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { useMutation } from "@/hooks/use-mutation";
import { EVIDENCE_TYPE_LABEL } from "@/lib/labels";
import { toDateInput } from "@/lib/utils";
import { StudentPicker, type PickerStudent } from "./student-picker";
import { CriteriaPicker, type PickerCriteria } from "./criteria-picker";

type Initial = {
  id: string; title: string; description: string | null; type: EvidenceType; subjectId: string | null;
  collectedAt: Date; studentIds: string[]; criteriaIds: string[]; textContent: string | null; isText: boolean;
};
export type StudentMatchView = { studentId: string; fullName: string; reason: "full_name" | "student_code"; excerpt: string };

export function EvidenceEditForm({
  initial, students, subjects, criteria, matches,
}: { initial: Initial; students: PickerStudent[]; subjects: { id: string; name: string }[]; criteria: PickerCriteria[]; matches: StudentMatchView[] }) {
  const [form, setForm] = useState(initial);
  const { mutate, pending, error, fieldError } = useMutation();
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof Initial>(k: K, v: Initial[K]) => { setForm((f) => ({ ...f, [k]: v })); setSaved(false); };

  const pendingMatches = matches.filter((m) => !form.studentIds.includes(m.studentId));

  async function save(next = form) {
    const res = await mutate(`/api/evidence/${initial.id}`, "PATCH", {
      title: next.title,
      description: next.description ?? "",
      type: next.type,
      subjectId: next.subjectId ?? "",
      collectedAt: toDateInput(next.collectedAt),
      studentIds: next.studentIds,
      criteriaIds: next.criteriaIds,
      ...(next.isText && next.textContent !== initial.textContent ? { textContent: next.textContent ?? "" } : {}),
    });
    if (res.ok) setSaved(true);
  }

  return (
    <div className="space-y-6">
      {pendingMatches.length > 0 && (
        <Card className="border-info/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="size-4 text-info" /> Gợi ý học sinh liên quan</CardTitle>
            <CardDescription>Tìm thấy tên/mã học sinh trong nội dung (so khớp chuỗi tự động, không phải AI). Giáo viên quyết định có gắn hay không.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingMatches.map((m) => (
              <div key={m.studentId} className="flex items-start gap-3 rounded-lg border p-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{m.fullName} <span className="text-xs font-normal text-muted-foreground">· khớp {m.reason === "full_name" ? "họ tên" : "mã học sinh"}</span></p>
                  <p className="truncate text-xs text-muted-foreground">{m.excerpt}</p>
                </div>
                <Button size="sm" variant="secondary" disabled={pending} onClick={() => {
                  const next = { ...form, studentIds: [...form.studentIds, m.studentId] };
                  setForm(next);
                  save(next);
                }}><UserPlus /> Gắn</Button>
              </div>
            ))}
            {pendingMatches.length > 1 && (
              <Button size="sm" variant="outline" disabled={pending} onClick={() => {
                const next = { ...form, studentIds: [...new Set([...form.studentIds, ...pendingMatches.map((m) => m.studentId)])] };
                setForm(next);
                save(next);
              }}>Gắn tất cả {pendingMatches.length} học sinh</Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Phân loại minh chứng</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-4" noValidate>
            {error && <Alert tone="danger">{error}</Alert>}
            {saved && !pending && <Alert tone="success">Đã lưu thay đổi.</Alert>}
            <Field label="Tiêu đề" htmlFor="ev-title" error={fieldError("title")} required>
              <Input id="ev-title" value={form.title} onChange={(e) => set("title", e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Loại" htmlFor="ev-type">
                <Select id="ev-type" value={form.type} onChange={(e) => set("type", e.target.value as EvidenceType)}>
                  {Object.entries(EVIDENCE_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Select>
              </Field>
              <Field label="Môn học" htmlFor="ev-subject" error={fieldError("subjectId")}>
                <Select id="ev-subject" value={form.subjectId ?? ""} onChange={(e) => set("subjectId", e.target.value || null)}>
                  <option value="">— Chung —</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
              </Field>
              <Field label="Ngày thu thập" htmlFor="ev-date" error={fieldError("collectedAt")}>
                <Input id="ev-date" type="date" value={toDateInput(form.collectedAt)} onChange={(e) => e.target.value && set("collectedAt", new Date(`${e.target.value}T00:00:00Z`))} />
              </Field>
            </div>
            <Field label="Mô tả" htmlFor="ev-desc">
              <Textarea id="ev-desc" rows={2} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
            </Field>
            {form.isText && (
              <Field label="Nội dung" htmlFor="ev-text" error={fieldError("textContent")}>
                <Textarea id="ev-text" rows={6} value={form.textContent ?? ""} onChange={(e) => set("textContent", e.target.value)} />
              </Field>
            )}
            <div className="grid gap-4 xl:grid-cols-2">
              <Field label="Học sinh liên quan" htmlFor="ev-students" error={fieldError("studentIds")}>
                <StudentPicker id="ev-students" students={students} value={form.studentIds} onChange={(v) => set("studentIds", v)} />
              </Field>
              <Field label="Tiêu chí liên quan" htmlFor="ev-criteria" error={fieldError("criteriaIds")}>
                <CriteriaPicker criteria={criteria} value={form.criteriaIds} onChange={(v) => set("criteriaIds", v)} />
              </Field>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={pending}>{pending && <Loader2 className="animate-spin" />} Lưu phân loại</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
