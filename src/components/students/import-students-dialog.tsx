"use client";
import { useRef, useState } from "react";
import { CheckCircle2, Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useMutation } from "@/hooks/use-mutation";
import type { ImportRow } from "@/schemas/student";

type Preview = {
  total: number;
  valid: number;
  rows: { rowNumber: number; data: ImportRow | null; raw: Record<string, string>; errors: string[]; warnings: string[] }[];
};

export function ImportStudentsDialog({
  open, onOpenChange, classes, defaultClassId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  classes: { id: string; name: string; schoolYear: string }[];
  defaultClassId?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [classId, setClassId] = useState(defaultClassId ?? classes[0]?.id ?? "");
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);
  const { mutate, pending, error, reset } = useMutation();

  function close(o: boolean) {
    onOpenChange(o);
    if (!o) { setPreview(null); setResult(null); setFileName(null); reset(); }
  }

  async function upload(file: File) {
    setFileName(file.name);
    setPreview(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await mutate<Preview>(`/api/classes/${classId}/students/import`, "POST", fd, { refresh: false });
    if (res.ok) setPreview(res.data);
  }

  async function commit() {
    if (!preview) return;
    const rows = preview.rows.flatMap((r) => (r.data ? [r.data] : []));
    const res = await mutate<{ created: number; skipped: number }>(`/api/classes/${classId}/students/import`, "POST", { rows });
    if (res.ok) setResult(res.data);
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent title="Nhập danh sách học sinh từ Excel" description="Hỗ trợ .xlsx hoặc .csv, tối đa 500 học sinh, 2 MB." className="max-w-3xl">
        {result ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="size-10 text-success" />
            <p className="font-medium">Đã thêm {result.created} học sinh</p>
            {result.skipped > 0 && <p className="text-sm text-muted-foreground">{result.skipped} dòng bị bỏ qua do trùng mã học sinh.</p>}
            <Button onClick={() => close(false)}>Đóng</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {error && <Alert tone="danger">{error}</Alert>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nhập vào lớp" htmlFor="import-class">
                <Select id="import-class" value={classId} onChange={(e) => { setClassId(e.target.value); setPreview(null); }} disabled={pending}>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.schoolYear})</option>)}
                </Select>
              </Field>
              <div className="flex items-end">
                <Button asChild variant="link" className="px-0">
                  <a href="/api/students/import-template" download><Download /> Tải tệp mẫu (.xlsx)</a>
                </Button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) upload(f); }}
              disabled={pending || !classId}
              className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary-soft/30"
            >
              {pending && !preview ? <Loader2 className="size-6 animate-spin" /> : <Upload className="size-6" />}
              <span>{fileName ? <><FileSpreadsheet className="mr-1 inline size-4" />{fileName} — chọn tệp khác</> : "Kéo thả hoặc bấm để chọn tệp .xlsx / .csv"}</span>
              <span className="text-xs">Cột bắt buộc: Họ và tên. Cột tùy chọn: Mã học sinh, Ngày sinh (dd/mm/yyyy), Giới tính, Ghi chú.</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}
            />

            {preview && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium">Xem trước:</span>
                  <Badge tone="success">{preview.valid} hợp lệ</Badge>
                  {preview.total - preview.valid > 0 && <Badge tone="danger">{preview.total - preview.valid} lỗi — sẽ bỏ qua</Badge>}
                </div>
                <div className="max-h-72 overflow-y-auto rounded-lg border">
                  <Table>
                    <THead><tr><TH>Dòng</TH><TH>Họ và tên</TH><TH>Mã HS</TH><TH>Ngày sinh</TH><TH>Giới tính</TH><TH>Trạng thái</TH></tr></THead>
                    <TBody>
                      {preview.rows.map((r) => (
                        <TR key={r.rowNumber} className={r.data ? "" : "bg-danger-soft/50"}>
                          <TD className="tabular-nums text-muted-foreground">{r.rowNumber}</TD>
                          <TD>{r.raw.fullName || <i className="text-muted-foreground">(trống)</i>}</TD>
                          <TD>{r.raw.studentCode}</TD>
                          <TD>{r.raw.dateOfBirth}</TD>
                          <TD>{r.data?.gender ?? r.raw.gender}</TD>
                          <TD className="min-w-48 text-xs">
                            {r.errors.map((e) => <p key={e} className="text-danger">{e}</p>)}
                            {r.warnings.map((w) => <p key={w} className="text-warning">{w}</p>)}
                            {r.data && !r.warnings.length && <span className="text-success">Hợp lệ</span>}
                          </TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => close(false)}>Hủy</Button>
              <Button onClick={commit} disabled={!preview || preview.valid === 0 || pending}>
                {pending && preview && <Loader2 className="animate-spin" />} Nhập {preview?.valid ?? 0} học sinh
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
