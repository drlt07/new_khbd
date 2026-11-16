"use client";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { useMutation } from "@/hooks/use-mutation";
import { toDateInput } from "@/lib/utils";

export type StudentFormValues = {
  id?: string;
  classId: string;
  fullName: string;
  studentCode: string | null;
  dateOfBirth: Date | string | null;
  gender: string | null;
  notes: string | null;
};

export function StudentFormDialog({
  open, onOpenChange, initial, classes, defaultClassId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: StudentFormValues;
  /** Danh sách lớp để chọn (thêm mới) hoặc chuyển lớp (chỉnh sửa) */
  classes: { id: string; name: string; schoolYear: string }[];
  defaultClassId?: string;
}) {
  const { mutate, pending, error, fieldError, reset } = useMutation();
  const isEdit = Boolean(initial?.id);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const classId = String(fd.get("classId") ?? "");
    const body = {
      fullName: fd.get("fullName"),
      studentCode: fd.get("studentCode"),
      dateOfBirth: fd.get("dateOfBirth"),
      gender: fd.get("gender"),
      notes: fd.get("notes"),
      ...(isEdit ? { classId } : {}),
    };
    const res = isEdit
      ? await mutate(`/api/students/${initial!.id}`, "PATCH", body)
      : await mutate(`/api/classes/${classId}/students`, "POST", body);
    if (res.ok) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent title={isEdit ? "Chỉnh sửa thông tin học sinh" : "Thêm học sinh"}>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {error && <Alert tone="danger">{error}</Alert>}
          <Field label="Lớp" htmlFor="classId" required>
            <Select id="classId" name="classId" defaultValue={initial?.classId ?? defaultClassId ?? classes[0]?.id} required>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.schoolYear})</option>)}
            </Select>
          </Field>
          <Field label="Họ và tên" htmlFor="fullName" error={fieldError("fullName")} required>
            <Input id="fullName" name="fullName" defaultValue={initial?.fullName} autoFocus required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Mã học sinh" htmlFor="studentCode" error={fieldError("studentCode")}>
              <Input id="studentCode" name="studentCode" defaultValue={initial?.studentCode ?? ""} />
            </Field>
            <Field label="Ngày sinh" htmlFor="dateOfBirth" error={fieldError("dateOfBirth")}>
              <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={toDateInput(initial?.dateOfBirth)} />
            </Field>
            <Field label="Giới tính" htmlFor="gender" error={fieldError("gender")}>
              <Select id="gender" name="gender" defaultValue={initial?.gender ?? ""}>
                <option value="">—</option>
                <option>Nam</option>
                <option>Nữ</option>
                <option>Khác</option>
              </Select>
            </Field>
          </div>
          <Field label="Ghi chú" htmlFor="notes" error={fieldError("notes")} hint="Thông tin hành chính. Đặc điểm học tập nhập trong Hồ sơ học sinh.">
            <Textarea id="notes" name="notes" defaultValue={initial?.notes ?? ""} rows={2} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />} {isEdit ? "Lưu thay đổi" : "Thêm học sinh"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
