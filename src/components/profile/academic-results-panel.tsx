"use client";
import { useState } from "react";
import { Info, Loader2, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useMutation } from "@/hooks/use-mutation";
import { formatDate } from "@/lib/utils";
import type { SubjectOption } from "./types";

type Result = {
  id: string; assessmentName: string; term: string | null; score: number | null; maxScore: number | null;
  requirementRef: string | null; comment: string | null; recordedAt: Date; subject: { name: string };
};

export function AcademicResultsPanel({ studentId, results, subjects }: { studentId: string; results: Result[]; subjects: SubjectOption[] }) {
  const [open, setOpen] = useState(false);
  const add = useMutation();
  const del = useMutation();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget));
    const body = { ...fd, score: fd.score === "" ? null : fd.score, maxScore: fd.maxScore === "" ? null : fd.maxScore };
    if ((await add.mutate(`/api/students/${studentId}/academic-results`, "POST", body)).ok) setOpen(false);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>Kết quả học tập</CardTitle>
          <CardDescription className="flex items-start gap-1.5">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            Chỉ là dữ liệu tham khảo để nhận diện nhu cầu hỗ trợ và mức độ đáp ứng yêu cầu cần đạt — không dùng để xếp loại hay phân nhóm.
          </CardDescription>
        </div>
        <Button size="sm" variant="secondary" onClick={() => { add.reset(); setOpen(true); }} disabled={subjects.length === 0}
          title={subjects.length === 0 ? "Lớp chưa có môn học" : undefined}><Plus /> Thêm</Button>
      </CardHeader>
      <CardContent>
        {results.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">Chưa có kết quả học tập.</p>
        ) : (
          <Table>
            <THead><tr><TH>Môn</TH><TH>Bài đánh giá</TH><TH>Điểm</TH><TH className="hidden md:table-cell">YCCĐ liên quan</TH><TH className="hidden sm:table-cell">Ngày</TH><TH className="w-10" /></tr></THead>
            <TBody>
              {results.map((r) => (
                <TR key={r.id}>
                  <TD>{r.subject.name}</TD>
                  <TD>{r.assessmentName}{r.term && <span className="text-muted-foreground"> · {r.term}</span>}{r.comment && <p className="text-xs text-muted-foreground">{r.comment}</p>}</TD>
                  <TD className="tabular-nums">{r.score ?? "—"}{r.maxScore ? `/${r.maxScore}` : ""}</TD>
                  <TD className="hidden text-muted-foreground md:table-cell">{r.requirementRef ?? "—"}</TD>
                  <TD className="hidden text-muted-foreground sm:table-cell">{formatDate(r.recordedAt)}</TD>
                  <TD>
                    <ConfirmButton size="icon" variant="ghost" className="text-danger" aria-label="Xóa kết quả" title="Xóa kết quả học tập?"
                      description={`Xóa “${r.assessmentName}”.`} confirmLabel="Xóa" onConfirm={() => del.mutate(`/api/academic-results/${r.id}`, "DELETE")}>
                      <Trash2 />
                    </ConfirmButton>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </CardContent>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Thêm kết quả học tập">
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {add.error && <Alert tone="danger">{add.error}</Alert>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Môn học" htmlFor="ar-subject" error={add.fieldError("subjectId")} required>
                <Select id="ar-subject" name="subjectId">{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
              </Field>
              <Field label="Học kỳ" htmlFor="ar-term"><Input id="ar-term" name="term" placeholder="HK I" /></Field>
            </div>
            <Field label="Bài đánh giá" htmlFor="ar-name" error={add.fieldError("assessmentName")} required>
              <Input id="ar-name" name="assessmentName" placeholder="Kiểm tra giữa kỳ I" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Điểm" htmlFor="ar-score" error={add.fieldError("score")}><Input id="ar-score" name="score" type="number" step="0.25" min="0" /></Field>
              <Field label="Thang điểm" htmlFor="ar-max" error={add.fieldError("maxScore")}><Input id="ar-max" name="maxScore" type="number" step="0.5" min="0" defaultValue="10" /></Field>
            </div>
            <Field label="Yêu cầu cần đạt liên quan" htmlFor="ar-req"><Input id="ar-req" name="requirementRef" /></Field>
            <Field label="Nhận xét" htmlFor="ar-comment"><Input id="ar-comment" name="comment" /></Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={add.pending}>{add.pending && <Loader2 className="animate-spin" />} Lưu</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
