"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { useMutation } from "@/hooks/use-mutation";

export function CreateFrameworkButton({ subjects }: { subjects: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { mutate, pending, error, fieldError, reset } = useMutation();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await mutate<{ id: string }>("/api/frameworks", "POST", {
      name: fd.get("name"),
      description: fd.get("description"),
      subjectId: fd.get("subjectId"),
      fromDefault: fd.get("fromDefault") === "on",
    });
    if (res.ok) {
      setOpen(false);
      router.push(`/frameworks/${res.data.id}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <Button onClick={() => setOpen(true)}><Plus /> Tạo khung mới</Button>
      <DialogContent title="Tạo khung thông tin" description="Ví dụ: khung riêng cho môn Tin học hoặc cho hoạt động trải nghiệm.">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {error && <Alert tone="danger">{error}</Alert>}
          <Field label="Tên khung" htmlFor="fw-name" error={fieldError("name")} required>
            <Input id="fw-name" name="name" required autoFocus />
          </Field>
          <Field label="Áp dụng cho môn" htmlFor="fw-subject">
            <Select id="fw-subject" name="subjectId" defaultValue="">
              <option value="">Mọi môn học</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label="Mô tả" htmlFor="fw-desc">
            <Textarea id="fw-desc" name="description" rows={2} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="fromDefault" defaultChecked className="size-4 accent-[var(--primary)]" />
            Sao chép tiêu chí từ khung mặc định (A–F)
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={pending}>{pending && <Loader2 className="animate-spin" />} Tạo khung</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
