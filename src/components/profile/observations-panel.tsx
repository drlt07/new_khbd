"use client";
import { useRef } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { useMutation } from "@/hooks/use-mutation";
import { formatDate, toDateInput } from "@/lib/utils";
import type { SubjectOption } from "./types";

type Observation = { id: string; content: string; context: string | null; observedAt: Date; subject: { name: string } | null };

export function ObservationsPanel({ studentId, observations, subjects }: { studentId: string; observations: Observation[]; subjects: SubjectOption[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const add = useMutation();
  const del = useMutation();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const res = await add.mutate(`/api/students/${studentId}/observations`, "POST", Object.fromEntries(new FormData(e.currentTarget)));
    if (res.ok) formRef.current?.reset();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <Card className="order-2 lg:order-1">
        <CardHeader>
          <CardTitle>Nhận xét từ quá trình quan sát và giảng dạy</CardTitle>
          <CardDescription>Dữ liệu gốc của giáo viên. Ở Sprint 4, AI sẽ chỉ phân tích những nhận xét này khi giáo viên yêu cầu.</CardDescription>
        </CardHeader>
        <CardContent>
          {observations.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">Chưa có nhận xét.</p>
          ) : (
            <ul className="space-y-3">
              {observations.map((o) => (
                <li key={o.id} className="rounded-lg border p-3">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="whitespace-pre-line text-sm">{o.content}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{formatDate(o.observedAt)}</span>
                        {o.subject && <Badge>{o.subject.name}</Badge>}
                        {o.context && <span>· {o.context}</span>}
                      </div>
                    </div>
                    <ConfirmButton size="icon" variant="ghost" className="text-danger" aria-label="Xóa nhận xét" title="Xóa nhận xét?"
                      description="Nhận xét sẽ bị xóa khỏi hồ sơ." confirmLabel="Xóa" onConfirm={() => del.mutate(`/api/observations/${o.id}`, "DELETE")}>
                      <Trash2 />
                    </ConfirmButton>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card className="order-1 h-fit lg:order-2">
        <CardHeader><CardTitle>Thêm nhận xét</CardTitle></CardHeader>
        <CardContent>
          <form ref={formRef} onSubmit={onSubmit} className="space-y-3" noValidate>
            {add.error && <Alert tone="danger">{add.error}</Alert>}
            <Field label="Nội dung" htmlFor="obs-content" error={add.fieldError("content")} required>
              <Textarea id="obs-content" name="content" rows={4} placeholder="Mô tả hành vi, sản phẩm hoặc tình huống cụ thể quan sát được…" />
            </Field>
            <Field label="Bối cảnh" htmlFor="obs-context" hint="Ví dụ: Tiết thảo luận nhóm, bài 5">
              <Input id="obs-context" name="context" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Môn học" htmlFor="obs-subject">
                <Select id="obs-subject" name="subjectId" defaultValue="">
                  <option value="">— Chung —</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
              </Field>
              <Field label="Ngày" htmlFor="obs-date" error={add.fieldError("observedAt")}>
                <Input id="obs-date" name="observedAt" type="date" defaultValue={toDateInput(new Date())} />
              </Field>
            </div>
            <Button type="submit" className="w-full" disabled={add.pending}>{add.pending && <Loader2 className="animate-spin" />} Lưu nhận xét</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
