"use client";
import { useState } from "react";
import { ExternalLink, FolderOpen, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { TagInput } from "@/components/ui/tag-input";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { useMutation } from "@/hooks/use-mutation";
import { RESOURCE_TYPES } from "@/schemas/resource";

type R = { id: string; title: string; type: string; subject: string | null; url: string | null; description: string | null; tags: string[] };
const empty: Omit<R, "id"> = { title: "", type: RESOURCE_TYPES[0], subject: "", url: "", description: "", tags: [] };

export function ResourceManager({ items }: { items: R[] }) {
  const [edit, setEdit] = useState<(Omit<R, "id"> & { id?: string }) | null>(null);
  const { mutate, pending, error, fieldError, reset } = useMutation();
  const del = useMutation();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    const { id, ...body } = edit;
    const r = await mutate(id ? `/api/resources/${id}` : "/api/resources", id ? "PUT" : "POST", body);
    if (r.ok) setEdit(null);
  }
  return (
    <>
      <div className="mb-4 flex justify-end"><Button onClick={() => { reset(); setEdit({ ...empty }); }}><Plus /> Thêm học liệu</Button></div>
      {items.length ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((r) => (
            <Card key={r.id} className="flex flex-col gap-2 p-4">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1"><p className="font-medium">{r.title}</p><p className="text-xs text-muted-foreground">{r.type}{r.subject ? ` · ${r.subject}` : ""}</p></div>
                <Button size="icon" variant="ghost" className="size-8" aria-label={`Sửa ${r.title}`} onClick={() => { reset(); setEdit({ ...r }); }}><Pencil /></Button>
                <ConfirmButton size="icon" variant="ghost" className="size-8 text-danger" aria-label={`Xóa ${r.title}`} title="Xóa học liệu?" description={r.title} confirmLabel="Xóa" onConfirm={() => del.mutate(`/api/resources/${r.id}`, "DELETE")}><Trash2 /></ConfirmButton>
              </div>
              {r.description && <p className="line-clamp-3 whitespace-pre-line text-sm text-slate-600">{r.description}</p>}
              <div className="mt-auto flex flex-wrap items-center gap-1">
                {r.tags.map((t) => <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{t}</span>)}
                {r.url && <a href={r.url} target="_blank" rel="noreferrer" className="ml-auto flex items-center gap-1 text-xs text-primary hover:underline">Mở <ExternalLink className="size-3" /></a>}
              </div>
            </Card>
          ))}
        </div>
      ) : <EmptyState icon={FolderOpen} title="Chưa có học liệu" description="Lưu phiếu học tập, bài đọc, video… để dùng lại khi thiết kế nhiệm vụ cho các nhóm." />}

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent title={edit?.id ? "Sửa học liệu" : "Thêm học liệu"}>
          {edit && (
            <form onSubmit={submit} className="space-y-3" noValidate>
              <Field label="Tên học liệu" htmlFor="r-title" required error={fieldError("title")}><Input id="r-title" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Loại" htmlFor="r-type"><Select id="r-type" value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value })}>{RESOURCE_TYPES.map((t) => <option key={t}>{t}</option>)}</Select></Field>
                <Field label="Môn học" htmlFor="r-subject"><Input id="r-subject" value={edit.subject ?? ""} onChange={(e) => setEdit({ ...edit, subject: e.target.value })} /></Field>
              </div>
              <Field label="Đường dẫn" htmlFor="r-url" error={fieldError("url")}><Input id="r-url" value={edit.url ?? ""} placeholder="https://…" onChange={(e) => setEdit({ ...edit, url: e.target.value })} /></Field>
              <Field label="Nội dung / mô tả" htmlFor="r-desc"><Textarea id="r-desc" rows={5} value={edit.description ?? ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
              <Field label="Thẻ" htmlFor="r-tags"><TagInput id="r-tags" value={edit.tags} onChange={(tags) => setEdit({ ...edit, tags })} placeholder="Ví dụ: Nhóm củng cố" /></Field>
              {error && <Alert tone="danger">{error}</Alert>}
              <DialogFooter><Button type="button" variant="outline" onClick={() => setEdit(null)}>Hủy</Button><Button type="submit" disabled={pending}>{pending && <Loader2 className="animate-spin" />} Lưu</Button></DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
