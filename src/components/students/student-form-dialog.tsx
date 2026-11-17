"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { TagInput } from "@/components/ui/tag-input";
import { useMutation } from "@/hooks/use-mutation";

export type StudentFormValues = {
  id?: string;
  classId: string;
  fullName: string;
  studentCode: string | null;
  gender: string | null;
  notes: string | null;
  interests: string[];
  strengths: string[];
  needs: string[];
};

export type TraitSuggestions = { interests: string[]; strengths: string[]; needs: string[] };

export function StudentFormDialog({
  open, onOpenChange, initial, classes, defaultClassId, suggestions,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: StudentFormValues;
  classes: { id: string; name: string; schoolYear: string }[];
  defaultClassId?: string;
  suggestions: TraitSuggestions;
}) {
  const { mutate, pending, error, fieldError, reset } = useMutation();
  const [traits, setTraits] = useState({ interests: initial?.interests ?? [], strengths: initial?.strengths ?? [], needs: initial?.needs ?? [] });
  const isEdit = Boolean(initial?.id);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = { fullName: fd.get("fullName"), studentCode: fd.get("studentCode"), gender: fd.get("gender"), notes: fd.get("notes"), ...traits };
    const res = isEdit
      ? await mutate(`/api/students/${initial!.id}`, "PATCH", body)
      : await mutate(`/api/classes/${fd.get("classId")}/students`, "POST", body);
    if (res.ok) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent title={isEdit ? "Sửa học sinh" : "Thêm học sinh"} description="Sở thích, thế mạnh và nhu cầu hỗ trợ dùng để gợi ý chia nhóm.">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {error && <Alert tone="danger">{error}</Alert>}
          {!isEdit && (
            <Field label="Lớp" htmlFor="classId" required>
              <Select id="classId" name="classId" defaultValue={defaultClassId ?? classes[0]?.id}>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.schoolYear})</option>)}
              </Select>
            </Field>
          )}
          <Field label="Họ và tên" htmlFor="fullName" error={fieldError("fullName")} required>
            <Input id="fullName" name="fullName" defaultValue={initial?.fullName} autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Mã học sinh" htmlFor="studentCode" error={fieldError("studentCode")}>
              <Input id="studentCode" name="studentCode" defaultValue={initial?.studentCode ?? ""} />
            </Field>
            <Field label="Giới tính" htmlFor="gender" error={fieldError("gender")}>
              <Select id="gender" name="gender" defaultValue={initial?.gender ?? ""}>
                <option value="">—</option><option>Nam</option><option>Nữ</option><option>Khác</option>
              </Select>
            </Field>
          </div>
          <Field label="Sở thích" htmlFor="interests" hint="Nhấn Enter để thêm. Ví dụ: Văn học, Thiết kế, Lập trình">
            <TagInput id="interests" value={traits.interests} onChange={(v) => setTraits({ ...traits, interests: v })} suggestions={suggestions.interests} placeholder="Thêm sở thích…" />
          </Field>
          <Field label="Thế mạnh" htmlFor="strengths" hint="Ví dụ: Thuyết trình, Vẽ, Tư duy logic, Tổ chức nhóm">
            <TagInput id="strengths" value={traits.strengths} onChange={(v) => setTraits({ ...traits, strengths: v })} suggestions={suggestions.strengths} placeholder="Thêm thế mạnh…" tone="success" />
          </Field>
          <Field label="Cần hỗ trợ" htmlFor="needs" hint="Ví dụ: Cần thêm thời gian, Kỹ năng viết, Ngại phát biểu">
            <TagInput id="needs" value={traits.needs} onChange={(v) => setTraits({ ...traits, needs: v })} suggestions={suggestions.needs} placeholder="Thêm nhu cầu hỗ trợ…" tone="warning" />
          </Field>
          <Field label="Ghi chú" htmlFor="notes">
            <Input id="notes" name="notes" defaultValue={initial?.notes ?? ""} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={pending}>{pending && <Loader2 className="animate-spin" />} {isEdit ? "Lưu" : "Thêm học sinh"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
