"use client";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, FileText, Loader2, Upload, X } from "lucide-react";
import type { EvidenceType } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EVIDENCE_TYPE_LABEL } from "@/lib/labels";
import { toDateInput } from "@/lib/utils";
import { StudentPicker, type PickerStudent } from "./student-picker";
import { CriteriaPicker, type PickerCriteria } from "./criteria-picker";
import { formatBytes } from "./evidence-badges";

export type IntakeClass = { id: string; name: string; schoolYear: string; students: PickerStudent[]; subjects: { id: string; name: string }[] };

const ACCEPT = ".pdf,.docx,.xlsx,.csv,.png,.jpg,.jpeg";
const ALLOWED_EXT = ["pdf", "docx", "xlsx", "csv", "png", "jpg", "jpeg"];
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 10;

type Outcome = { fileName: string; ok: boolean; evidenceId?: string; status?: string; error?: string; duplicateOf?: string };

export function IntakeForm({
  classes, criteria, defaultClassId, defaultStudentId,
}: { classes: IntakeClass[]; criteria: PickerCriteria[]; defaultClassId?: string; defaultStudentId?: string }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [classId, setClassId] = useState(defaultClassId && classes.some((c) => c.id === defaultClassId) ? defaultClassId : classes[0]?.id ?? "");
  const cls = useMemo(() => classes.find((c) => c.id === classId), [classes, classId]);
  const [subjectId, setSubjectId] = useState("");
  const [type, setType] = useState<EvidenceType>("ASSIGNMENT");
  const [collectedAt, setCollectedAt] = useState(toDateInput(new Date()));
  const [studentIds, setStudentIds] = useState<string[]>(defaultStudentId ? [defaultStudentId] : []);
  const [criteriaIds, setCriteriaIds] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [note, setNote] = useState({ title: "", text: "" });
  const [mode, setMode] = useState<"files" | "text">("files");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [outcomes, setOutcomes] = useState<Outcome[] | null>(null);

  function changeClass(id: string) {
    setClassId(id);
    setStudentIds([]);
    setSubjectId("");
  }

  /** Kiểm tra sơ bộ phía trình duyệt; máy chủ vẫn kiểm tra lại nội dung tệp. */
  function addFiles(list: FileList | File[]) {
    const errs: string[] = [];
    const next = [...files];
    for (const f of Array.from(list)) {
      const ext = f.name.toLowerCase().split(".").pop() ?? "";
      if (!ALLOWED_EXT.includes(ext)) errs.push(`${f.name}: định dạng không được hỗ trợ`);
      else if (f.size > MAX_BYTES) errs.push(`${f.name}: vượt quá 10 MB`);
      else if (next.length >= MAX_FILES) errs.push(`Tối đa ${MAX_FILES} tệp mỗi lần`);
      else if (!next.some((x) => x.name === f.name && x.size === f.size)) next.push(f);
    }
    setFiles(next);
    setFileErrors(errs);
  }

  async function submit() {
    setPending(true);
    setError(null);
    setFieldErrors({});
    setOutcomes(null);
    try {
      let res: Response;
      if (mode === "files") {
        const fd = new FormData();
        fd.set("classId", classId);
        fd.set("subjectId", subjectId);
        fd.set("type", type);
        fd.set("collectedAt", collectedAt);
        studentIds.forEach((id) => fd.append("studentIds", id));
        criteriaIds.forEach((id) => fd.append("criteriaIds", id));
        files.forEach((f) => fd.append("files", f));
        res = await fetch("/api/evidence", { method: "POST", body: fd });
      } else {
        res = await fetch("/api/evidence/note", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ classId, subjectId, type, collectedAt, studentIds, criteriaIds, title: note.title, textContent: note.text }),
        });
      }
      const json = await res.json().catch(() => ({}));
      if (mode === "files" && Array.isArray(json.data)) {
        setOutcomes(json.data);
        setFiles([]);
      } else if (res.ok) {
        setOutcomes([{ fileName: note.title, ok: true, evidenceId: json.data.id, status: json.data.processingStatus }]);
        setNote({ title: "", text: "" });
      } else {
        setError(json.error ?? "Đã xảy ra lỗi");
        if (json.details) setFieldErrors(json.details);
      }
      router.refresh();
    } catch {
      setError("Không thể kết nối tới máy chủ");
    } finally {
      setPending(false);
    }
  }

  if (!classes.length) {
    return <Alert tone="warning">Chưa có lớp học. <Link href="/classes" className="font-medium underline">Tạo lớp học</Link> trước khi cung cấp dữ liệu.</Alert>;
  }

  const canSubmit = !pending && classId && (mode === "files" ? files.length > 0 : note.title.trim().length >= 2 && note.text.trim().length >= 5);
  const typeOptions = mode === "text" ? (["OBSERVATION_NOTE", "ASSESSMENT_DOC", "OTHER"] as EvidenceType[]) : (Object.keys(EVIDENCE_TYPE_LABEL) as EvidenceType[]);

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>1. Phân loại dữ liệu</CardTitle>
          <CardDescription>Gắn dữ liệu với lớp, học sinh, môn học và tiêu chí.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Lớp" htmlFor="in-class" required>
            <Select id="in-class" value={classId} onChange={(e) => changeClass(e.target.value)}>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.schoolYear})</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 xl:grid-cols-2">
            <Field label="Môn học" htmlFor="in-subject" error={fieldErrors.subjectId?.[0]}>
              <Select id="in-subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                <option value="">— Chung —</option>
                {cls?.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </Field>
            <Field label="Ngày thu thập" htmlFor="in-date" error={fieldErrors.collectedAt?.[0]}>
              <Input id="in-date" type="date" value={collectedAt} onChange={(e) => setCollectedAt(e.target.value)} />
            </Field>
          </div>
          <Field label="Loại minh chứng" htmlFor="in-type" required error={fieldErrors.type?.[0]}>
            <Select id="in-type" value={type} onChange={(e) => setType(e.target.value as EvidenceType)}>
              {typeOptions.map((t) => <option key={t} value={t}>{EVIDENCE_TYPE_LABEL[t]}</option>)}
            </Select>
          </Field>
          <Field label="Học sinh liên quan" htmlFor="in-students" error={fieldErrors.studentIds?.[0]}
            hint="Có thể để trống với tài liệu cả lớp — hệ thống sẽ gợi ý học sinh có tên trong tài liệu.">
            <StudentPicker id="in-students" students={cls?.students ?? []} value={studentIds} onChange={setStudentIds} />
          </Field>
          <Field label="Tiêu chí liên quan" htmlFor="in-criteria" error={fieldErrors.criteriaIds?.[0]}>
            <CriteriaPicker criteria={criteria} value={criteriaIds} onChange={setCriteriaIds} />
          </Field>
        </CardContent>
      </Card>

      <div className="min-w-0 space-y-6">
        <Card>
          <CardHeader><CardTitle>2. Cung cấp dữ liệu</CardTitle></CardHeader>
          <CardContent>
            <Tabs value={mode} onValueChange={(v) => { setMode(v as "files" | "text"); setType(v === "text" ? "OBSERVATION_NOTE" : "ASSIGNMENT"); }}>
              <TabsList>
                <TabsTrigger value="files"><Upload className="size-4" /> Tải tệp</TabsTrigger>
                <TabsTrigger value="text"><FileText className="size-4" /> Nhập văn bản</TabsTrigger>
              </TabsList>
              <TabsContent value="files" className="space-y-3">
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
                  className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary-soft/30"
                >
                  <Upload className="size-7 text-primary" />
                  <span className="font-medium text-foreground">Kéo thả hoặc bấm để chọn tệp</span>
                  <span className="text-xs">Bảng điểm, bài kiểm tra, bài tập, sản phẩm, ảnh minh chứng, tài liệu đánh giá</span>
                  <span className="text-xs">PDF · DOCX · XLSX · CSV · PNG · JPG — tối đa {MAX_FILES} tệp, mỗi tệp 10 MB</span>
                </button>
                <input ref={fileInput} type="file" multiple accept={ACCEPT} className="hidden" aria-label="Chọn tệp minh chứng"
                  onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} />
                {fileErrors.map((e) => <p key={e} className="text-xs text-danger">{e}</p>)}
                {files.length > 0 && (
                  <ul className="divide-y rounded-lg border">
                    {files.map((f) => (
                      <li key={f.name + f.size} className="flex items-center gap-2 px-3 py-2 text-sm">
                        <FileText className="size-4 text-muted-foreground" />
                        <span className="flex-1 truncate">{f.name}</span>
                        <span className="text-xs text-muted-foreground">{formatBytes(f.size)}</span>
                        <button type="button" onClick={() => setFiles(files.filter((x) => x !== f))} aria-label={`Bỏ ${f.name}`} className="rounded p-0.5 hover:bg-muted">
                          <X className="size-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>
              <TabsContent value="text" className="space-y-3">
                <Field label="Tiêu đề" htmlFor="note-title" required error={fieldErrors.title?.[0]}>
                  <Input id="note-title" value={note.title} onChange={(e) => setNote({ ...note, title: e.target.value })} placeholder="Ví dụ: Nhận xét giờ thảo luận nhóm tuần 5" />
                </Field>
                <Field label="Nội dung nhận xét" htmlFor="note-text" required error={fieldErrors.textContent?.[0]}
                  hint="Có thể nhận xét nhiều học sinh trong cùng văn bản — hệ thống sẽ gợi ý học sinh được nhắc tên.">
                  <Textarea id="note-text" rows={8} value={note.text} onChange={(e) => setNote({ ...note, text: e.target.value })}
                    placeholder="Mô tả cụ thể hành vi, sản phẩm, tình huống quan sát được…" />
                </Field>
              </TabsContent>
            </Tabs>
            {error && <Alert tone="danger" className="mt-4">{error}</Alert>}
            <div className="mt-4 flex justify-end">
              <Button onClick={submit} disabled={!canSubmit}>
                {pending && <Loader2 className="animate-spin" />}
                {mode === "files" ? `Tải lên ${files.length || ""} tệp`.replace("  ", " ") : "Lưu văn bản"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {outcomes && (
          <Card>
            <CardHeader><CardTitle>3. Kết quả xử lý</CardTitle></CardHeader>
            <CardContent>
              <ul className="divide-y">
                {outcomes.map((o, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-2 py-2.5 text-sm">
                    {o.ok ? (o.status === "FAILED" ? <AlertTriangle className="size-4 text-warning" /> : <CheckCircle2 className="size-4 text-success" />) : <AlertTriangle className="size-4 text-danger" />}
                    <span className="flex-1 font-medium">{o.fileName}</span>
                    {o.ok ? (
                      <>
                        {o.status === "FAILED" && <span className="text-xs text-warning">Đã lưu nhưng không trích xuất được nội dung</span>}
                        {o.duplicateOf && <span className="text-xs text-warning">Tệp trùng với minh chứng đã có</span>}
                        <Button asChild size="sm" variant="outline"><Link href={`/evidence/${o.evidenceId}`}>Xem & phân loại</Link></Button>
                      </>
                    ) : (
                      <span className="text-xs text-danger">{o.error}</span>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
