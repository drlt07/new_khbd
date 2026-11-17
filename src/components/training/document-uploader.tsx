"use client";
import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileText, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation } from "@/hooks/use-mutation";
import { formatBytes } from "@/components/evidence/evidence-badges";

const MAX = 50 * 1024 * 1024;
type Outcome = { fileName: string; ok: boolean; status?: string; error?: string };

export function DocumentUploader({ collectionId }: { collectionId: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [warn, setWarn] = useState<string[]>([]);
  const [outcomes, setOutcomes] = useState<Outcome[] | null>(null);
  const { mutate, pending, error } = useMutation();

  function add(list: FileList | File[]) {
    const w: string[] = [];
    const next = [...files];
    for (const f of Array.from(list)) {
      const ext = f.name.toLowerCase().split(".").pop();
      if (ext !== "pdf" && ext !== "docx") w.push(`${f.name}: chỉ nhận PDF hoặc DOCX`);
      else if (f.size > MAX) w.push(`${f.name}: vượt quá 50 MB`);
      else if (next.length >= 10) w.push("Tối đa 10 tệp mỗi lần");
      else if (!next.some((x) => x.name === f.name && x.size === f.size)) next.push(f);
    }
    setFiles(next);
    setWarn(w);
  }

  async function upload() {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    setOutcomes(null);
    const res = await mutate<Outcome[]>(`/api/training/collections/${collectionId}/documents`, "POST", fd);
    // 422 khi mọi tệp đều lỗi — vẫn hiển thị lỗi từng tệp
    if (res.ok) setOutcomes(res.data);
    setFiles([]);
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); add(e.dataTransfer.files); }}
        disabled={pending}
        className="flex w-full flex-col items-center gap-1.5 rounded-lg border-2 border-dashed p-6 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary-soft/30"
      >
        <Upload className="size-6 text-primary" />
        <span className="font-medium text-foreground">Kéo thả hoặc bấm để thêm tài liệu</span>
        <span className="text-xs">PDF có lớp văn bản hoặc DOCX · tối đa 10 tệp, mỗi tệp 50 MB · có thể tải từng phần của một cuốn sách</span>
      </button>
      <input ref={input} type="file" multiple accept=".pdf,.docx" className="hidden" aria-label="Chọn tài liệu"
        onChange={(e) => { if (e.target.files) add(e.target.files); e.target.value = ""; }} />
      {warn.map((w) => <p key={w} className="text-xs text-danger">{w}</p>)}
      {files.length > 0 && (
        <>
          <ul className="divide-y rounded-lg border">
            {files.map((f) => (
              <li key={f.name + f.size} className="flex items-center gap-2 px-3 py-2 text-sm">
                <FileText className="size-4 text-muted-foreground" />
                <span className="flex-1 truncate">{f.name}</span>
                <span className="text-xs text-muted-foreground">{formatBytes(f.size)}</span>
                <button type="button" onClick={() => setFiles(files.filter((x) => x !== f))} aria-label={`Bỏ ${f.name}`} className="rounded p-0.5 hover:bg-muted"><X className="size-4" /></button>
              </li>
            ))}
          </ul>
          <div className="flex justify-end">
            <Button onClick={upload} disabled={pending}>
              {pending ? <><Loader2 className="animate-spin" /> Đang trích xuất & đánh chỉ mục…</> : `Thêm ${files.length} tài liệu`}
            </Button>
          </div>
        </>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
      {outcomes && (
        <ul className="space-y-1 text-sm">
          {outcomes.map((o, i) => (
            <li key={i} className="flex items-center gap-2">
              {o.ok && o.status === "EXTRACTED" ? <CheckCircle2 className="size-4 text-success" /> : <AlertTriangle className="size-4 text-danger" />}
              <span className="truncate">{o.fileName}</span>
              <span className="text-xs text-muted-foreground">{o.ok ? (o.status === "EXTRACTED" ? "đã đánh chỉ mục" : "không trích xuất được") : o.error}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
