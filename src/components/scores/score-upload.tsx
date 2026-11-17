"use client";
import { useRef, useState } from "react";
import { CheckCircle2, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useMutation } from "@/hooks/use-mutation";
import { cn } from "@/lib/utils";

type Col = { index: number; header: string; subject: string | null; componentLabel: string; weight: number; sample: string[] };
type Preview = {
  fileName: string; nameColumn: string; codeColumn: string | null; headerRows: number[]; subjects: string[];
  columns: Col[]; rows: { rowNumber: number; fullName: string; code: string | null; match: string; matched: boolean }[];
  matched: number; unmatched: number;
};

export function ScoreUpload({ classId, studentCount }: { classId: string; studentCount: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [subject, setSubject] = useState("");
  const [cols, setCols] = useState<Record<number, { on: boolean; label: string; weight: number }>>({});
  const [createMissing, setCreateMissing] = useState(studentCount === 0);
  const [done, setDone] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const pv = useMutation();
  const commit = useMutation();

  async function choose(f: File | undefined) {
    if (!f) return;
    setFile(f); setPreview(null); setDone(null);
    const fd = new FormData(); fd.set("file", f); fd.set("mode", "preview");
    const res = await pv.mutate<Preview>(`/api/classes/${classId}/scores`, "POST", fd, { refresh: false });
    if (!res.ok) return;
    const d = res.data;
    setPreview(d);
    const main = d.subjects[0] ?? "";
    setSubject(main);
    setCols(Object.fromEntries(d.columns.map((c) => [c.index, { on: !main || c.subject === main || !c.subject, label: c.header, weight: c.weight }])));
  }

  function changeSubject(s: string) {
    setSubject(s);
    if (preview?.subjects.includes(s)) setCols((cs) => Object.fromEntries(preview.columns.map((c) => [c.index, { ...cs[c.index], on: c.subject === s }])));
  }

  async function save() {
    if (!file || !preview) return;
    const fd = new FormData(); fd.set("file", file); fd.set("mode", "commit");
    fd.set("options", JSON.stringify({ subject, createMissing, columns: preview.columns.filter((c) => cols[c.index]?.on).map((c) => ({ index: c.index, label: cols[c.index].label, weight: cols[c.index].weight })) }));
    const res = await commit.mutate<{ students: number; created: number; skipped: number; scores: number }>(`/api/classes/${classId}/scores`, "POST", fd);
    if (res.ok) {
      setDone(`Đã lưu ${res.data.scores} điểm của ${res.data.students} học sinh${res.data.created ? ` (thêm mới ${res.data.created} học sinh)` : ""}${res.data.skipped ? `, bỏ qua ${res.data.skipped} dòng không khớp` : ""}.`);
      setPreview(null); setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const selected = preview ? preview.columns.filter((c) => cols[c.index]?.on).length : 0;

  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="font-semibold">Tải bảng điểm</h2>
        <p className="text-sm text-muted-foreground">Bảng điểm xuất từ vnEdu, SMAS hoặc tự lập (.xlsx, .csv). Hệ thống tự nhận diện cột họ tên, mã học sinh và các cột điểm; thầy cô kiểm tra trước khi lưu.</p>
      </div>
      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); choose(e.dataTransfer.files[0]); }}
        className={cn("flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-primary/50 hover:bg-primary-soft/30", drag && "border-primary bg-primary-soft/40")}
      >
        <input ref={inputRef} type="file" accept=".xlsx,.csv" className="sr-only" onChange={(e) => choose(e.target.files?.[0])} />
        {pv.pending ? <Loader2 className="size-6 animate-spin text-primary" /> : <Upload className="size-6 text-primary" />}
        <span className="text-sm"><b className="text-primary">Chọn tệp</b> hoặc kéo thả vào đây</span>
        {file && <span className="flex items-center gap-1 text-xs text-muted-foreground"><FileSpreadsheet className="size-3.5" />{file.name}</span>}
      </label>
      {pv.error && <Alert tone="danger">{pv.error}</Alert>}
      {done && <Alert tone="success" className="flex items-center gap-2"><CheckCircle2 className="size-4" />{done}</Alert>}

      {preview && (
        <div className="space-y-4 border-t pt-4">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-muted px-2.5 py-1">Cột họ tên: <b>{preview.nameColumn}</b></span>
            {preview.codeColumn && <span className="rounded-full bg-muted px-2.5 py-1">Cột mã HS: <b>{preview.codeColumn}</b></span>}
            <span className="rounded-full bg-muted px-2.5 py-1">Tiêu đề ở dòng {preview.headerRows.join(", ") || "—"}</span>
            <span className="rounded-full bg-success-soft px-2.5 py-1 text-success">Khớp {preview.matched} học sinh trong lớp</span>
            {preview.unmatched > 0 && <span className="rounded-full bg-warning-soft px-2.5 py-1 text-warning">{preview.unmatched} dòng chưa khớp</span>}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="subject" className="text-sm font-medium">Môn học của bảng điểm</label>
              <Input id="subject" list="subjects" value={subject} onChange={(e) => changeSubject(e.target.value)} placeholder="Ví dụ: Ngữ văn" />
              <datalist id="subjects">{preview.subjects.map((s) => <option key={s} value={s} />)}</datalist>
              {preview.subjects.length > 1 && <p className="text-xs text-muted-foreground">Tệp có nhiều môn ({preview.subjects.join(", ")}) — chọn môn để lọc cột tương ứng.</p>}
            </div>
            {preview.unmatched > 0 && (
              <label className="flex items-start gap-2 rounded-lg border p-3 text-sm">
                <input type="checkbox" className="mt-0.5" checked={createMissing} onChange={(e) => setCreateMissing(e.target.checked)} />
                <span>Thêm {preview.rows.filter((r) => r.match === "none").length} học sinh chưa có vào lớp<br />
                  <span className="text-xs text-muted-foreground">Bỏ chọn: các dòng không khớp sẽ bị bỏ qua.{preview.rows.some((r) => r.match === "ambiguous") && " Dòng trùng tên với nhiều học sinh luôn bị bỏ qua."}</span></span>
              </label>
            )}
          </div>

          <Table>
            <THead><TR><TH className="w-10">Dùng</TH><TH>Cột trong tệp</TH><TH>Môn</TH><TH>Loại điểm</TH><TH>Hệ số</TH><TH>Ví dụ</TH></TR></THead>
            <TBody>
              {preview.columns.map((c) => (
                <TR key={c.index}>
                  <TD><input type="checkbox" aria-label={`Dùng cột ${c.header}`} checked={!!cols[c.index]?.on} onChange={(e) => setCols((cs) => ({ ...cs, [c.index]: { ...cs[c.index], on: e.target.checked } }))} /></TD>
                  <TD><Input aria-label="Tên cột" value={cols[c.index]?.label ?? ""} onChange={(e) => setCols((cs) => ({ ...cs, [c.index]: { ...cs[c.index], label: e.target.value } }))} className="h-8 min-w-40" /></TD>
                  <TD className="text-muted-foreground">{c.subject ?? "—"}</TD>
                  <TD>{c.componentLabel}</TD>
                  <TD>
                    <Select aria-label="Hệ số" value={cols[c.index]?.weight ?? 1} onChange={(e) => setCols((cs) => ({ ...cs, [c.index]: { ...cs[c.index], weight: Number(e.target.value) } }))} className="h-8 w-16">
                      {[1, 2, 3].map((w) => <option key={w} value={w}>{w}</option>)}
                    </Select>
                  </TD>
                  <TD className="text-xs text-muted-foreground">{c.sample.join(", ")}</TD>
                </TR>
              ))}
            </TBody>
          </Table>

          {preview.unmatched > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground">Xem các dòng chưa khớp</summary>
              <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                {preview.rows.filter((r) => !r.matched).map((r) => (
                  <li key={r.rowNumber} className="text-muted-foreground">Dòng {r.rowNumber}: {r.fullName}{r.code ? ` (${r.code})` : ""} — {r.match === "ambiguous" ? "trùng tên nhiều học sinh" : "chưa có trong lớp"}</li>
                ))}
              </ul>
            </details>
          )}

          {commit.error && <Alert tone="danger">{commit.error}</Alert>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setPreview(null); setFile(null); }}>Hủy</Button>
            <Button onClick={save} disabled={commit.pending || !selected || !subject.trim()}>
              {commit.pending && <Loader2 className="animate-spin" />} Lưu bảng điểm ({selected} cột)
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
