"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { useMutation } from "@/hooks/use-mutation";
import { currentSchoolYear } from "@/lib/utils";

type Initial = { id: string; name: string; schoolYear: string };

/** Nút + hộp thoại tạo / sửa lớp */
export function ClassFormButton({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { mutate, pending, error, fieldError, reset } = useMutation();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    const res = initial ? await mutate(`/api/classes/${initial.id}`, "PATCH", body) : await mutate<{ id: string }>("/api/classes", "POST", body);
    if (res.ok) {
      setOpen(false);
      if (!initial) router.push(`/classes/${(res.data as { id: string }).id}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      {initial
        ? <Button variant="outline" onClick={() => setOpen(true)}><Pencil /> Sửa lớp</Button>
        : <Button onClick={() => setOpen(true)}><Plus /> Tạo lớp</Button>}
      <DialogContent title={initial ? "Sửa lớp học" : "Tạo lớp học"}>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {error && <Alert tone="danger">{error}</Alert>}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tên lớp" htmlFor="name" error={fieldError("name")} required>
              <Input id="name" name="name" defaultValue={initial?.name} placeholder="12A1" autoFocus />
            </Field>
            <Field label="Năm học" htmlFor="schoolYear" error={fieldError("schoolYear")} required>
              <Input id="schoolYear" name="schoolYear" defaultValue={initial?.schoolYear ?? currentSchoolYear()} />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={pending}>{pending && <Loader2 className="animate-spin" />} {initial ? "Lưu" : "Tạo lớp"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
