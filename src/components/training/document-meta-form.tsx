"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { useMutation } from "@/hooks/use-mutation";

export function DocumentMetaForm({ doc }: { doc: { id: string; title: string; volume: string | null; description: string | null } }) {
  const { mutate, pending, error, fieldError } = useMutation();
  const [saved, setSaved] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(false);
    const r = await mutate(`/api/training/documents/${doc.id}`, "PATCH", Object.fromEntries(new FormData(e.currentTarget)));
    if (r.ok) setSaved(true);
  }
  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      {error && <Alert tone="danger">{error}</Alert>}
      {saved && <Alert tone="success">Đã lưu.</Alert>}
      <Field label="Tên hiển thị (dùng khi trích dẫn)" htmlFor="doc-title" error={fieldError("title")}>
        <Input id="doc-title" name="title" defaultValue={doc.title} />
      </Field>
      <Field label="Tập" htmlFor="doc-volume" hint="Các phần cùng tập, trang liền nhau sẽ được nối để nhận diện bài học xuyên tệp.">
        <Input id="doc-volume" name="volume" defaultValue={doc.volume ?? ""} placeholder="Tập 1" />
      </Field>
      <Field label="Ghi chú" htmlFor="doc-desc"><Textarea id="doc-desc" name="description" rows={2} defaultValue={doc.description ?? ""} /></Field>
      <Button type="submit" disabled={pending}>{pending && <Loader2 className="animate-spin" />} Lưu</Button>
    </form>
  );
}
