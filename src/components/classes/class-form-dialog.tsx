"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { useMutation } from "@/hooks/use-mutation";
import { currentSchoolYear } from "@/lib/utils";
import { SubjectsInput } from "./subjects-input";

export type ClassFormValues = {
  id?: string;
  name: string;
  schoolYear: string;
  gradeLevel: number | null;
  description: string | null;
  subjects: string[];
};

export function ClassFormDialog({
  open, onOpenChange, initial, subjectSuggestions,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: ClassFormValues;
  subjectSuggestions: string[];
}) {
  const router = useRouter();
  const { mutate, pending, error, fieldError, reset } = useMutation();
  const [subjects, setSubjects] = useState<string[]>(initial?.subjects ?? []);
  const isEdit = Boolean(initial?.id);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name"),
      schoolYear: fd.get("schoolYear"),
      gradeLevel: fd.get("gradeLevel") || null,
      description: fd.get("description"),
      subjects,
    };
    const res = isEdit
      ? await mutate(`/api/classes/${initial!.id}`, "PATCH", body)
      : await mutate<{ id: string }>("/api/classes", "POST", body);
    if (res.ok) {
      onOpenChange(false);
      if (!isEdit) router.push(`/classes/${(res.data as { id: string }).id}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent title={isEdit ? "Chỉnh sửa lớp học" : "Tạo lớp học"} description="Khai báo lớp, năm học và các môn học giáo viên phụ trách.">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {error && <Alert tone="danger">{error}</Alert>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tên lớp" htmlFor="name" error={fieldError("name")} required>
              <Input id="name" name="name" defaultValue={initial?.name} placeholder="10A1" required autoFocus />
            </Field>
            <Field label="Năm học" htmlFor="schoolYear" error={fieldError("schoolYear")} required>
              <Input id="schoolYear" name="schoolYear" defaultValue={initial?.schoolYear ?? currentSchoolYear()} placeholder="2026-2027" required />
            </Field>
          </div>
          <Field label="Khối" htmlFor="gradeLevel" error={fieldError("gradeLevel")}>
            <Select id="gradeLevel" name="gradeLevel" defaultValue={initial?.gradeLevel ?? ""}>
              <option value="">— Không chọn —</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => <option key={g} value={g}>Khối {g}</option>)}
            </Select>
          </Field>
          <Field label="Môn học" htmlFor="subjects" error={fieldError("subjects")} hint="Môn chưa có trong hệ thống sẽ được tạo mới.">
            <SubjectsInput id="subjects" value={subjects} onChange={setSubjects} suggestions={subjectSuggestions} />
          </Field>
          <Field label="Mô tả" htmlFor="description" error={fieldError("description")}>
            <Textarea id="description" name="description" defaultValue={initial?.description ?? ""} rows={2} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />} {isEdit ? "Lưu thay đổi" : "Tạo lớp"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
