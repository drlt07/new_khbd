"use client";
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

type Initial = { id: string; name: string; description: string | null; subjectId: string | null; gradeLevel: number | null };

export function CollectionFormDialog({
  open, onOpenChange, subjects, initial,
}: { open: boolean; onOpenChange: (o: boolean) => void; subjects: { id: string; name: string }[]; initial?: Initial }) {
  const router = useRouter();
  const { mutate, pending, error, fieldError, reset } = useMutation();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    const res = initial
      ? await mutate(`/api/training/collections/${initial.id}`, "PATCH", body)
      : await mutate<{ id: string }>("/api/training/collections", "POST", body);
    if (res.ok) {
      onOpenChange(false);
      if (!initial) router.push(`/training/${(res.data as { id: string }).id}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent title={initial ? "Sửa bộ tài liệu" : "Tạo bộ tài liệu training"} description="Mỗi bộ gom tài liệu chuyên môn của một môn học (SGV, SGK, chương trình, tài liệu tập huấn…).">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {error && <Alert tone="danger">{error}</Alert>}
          <Field label="Tên bộ tài liệu" htmlFor="col-name" error={fieldError("name")} required>
            <Input id="col-name" name="name" defaultValue={initial?.name} placeholder="Ví dụ: Ngữ văn 12 – SGV Kết nối tri thức" autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Môn học" htmlFor="col-subject" error={fieldError("subjectId")} hint="AI dùng bộ này khi soạn KHBD môn tương ứng.">
              <Select id="col-subject" name="subjectId" defaultValue={initial?.subjectId ?? ""}>
                <option value="">— Chưa gắn môn —</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </Field>
            <Field label="Khối lớp" htmlFor="col-grade" error={fieldError("gradeLevel")}>
              <Select id="col-grade" name="gradeLevel" defaultValue={initial?.gradeLevel ?? ""}>
                <option value="">— Mọi khối —</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => <option key={g} value={g}>Khối {g}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Mô tả" htmlFor="col-desc" error={fieldError("description")}>
            <Textarea id="col-desc" name="description" rows={3} defaultValue={initial?.description ?? ""} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={pending}>{pending && <Loader2 className="animate-spin" />} {initial ? "Lưu" : "Tạo bộ tài liệu"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
