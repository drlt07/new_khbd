"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { useMutation } from "@/hooks/use-mutation";
import { cn } from "@/lib/utils";

type S = { id: string; title: string; version: number; subject: string | null; className: string; groups: { name: string; count: number; competency: string | null }[] };

export function NewLessonForm({ sessions, defaultSessionId }: { sessions: S[]; defaultSessionId?: string }) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState(sessions.find((s) => s.id === defaultSessionId)?.id ?? "");
  const [step, setStep] = useState(sessionId ? 2 : 1);
  const cur = sessions.find((s) => s.id === sessionId);
  const [subject, setSubject] = useState(cur?.subject ?? "");
  const { mutate, pending, error, fieldError } = useMutation();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget));
    const r = await mutate<{ id: string }>("/api/lessons", "POST", { ...fd, sessionId, subject }, { refresh: false });
    if (r.ok) { router.push(`/phase2/${r.data.id}`); router.refresh(); }
  }

  return (
    <div className="space-y-5">
      <ol className="flex flex-wrap gap-2 text-sm">
        {["Chọn dữ liệu phân nhóm", "Thiết lập bài học", "Tiến trình & nhiệm vụ (trong trình soạn)"].map((t, i) => (
          <li key={t} className={cn("flex items-center gap-2 rounded-full border px-3 py-1", i + 1 === step ? "border-primary bg-primary-soft text-primary" : i + 1 < step ? "text-success" : "text-muted-foreground")}>
            <span className="font-semibold">{i + 1 < step ? <Check className="size-3.5" /> : i + 1}</span>{t}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <>
          <p className="text-sm text-muted-foreground">Chỉ hiển thị hồ sơ nhóm <b>đã được giáo viên duyệt</b> ở Pha 1 (phiên bản mới nhất của mỗi bộ nhóm).</p>
          <div className="grid gap-3 md:grid-cols-2" role="radiogroup" aria-label="Hồ sơ nhóm">
            {sessions.map((s) => (
              <button key={s.id} type="button" role="radio" aria-checked={sessionId === s.id} onClick={() => { setSessionId(s.id); if (!subject && s.subject) setSubject(s.subject); }}
                className={cn("rounded-lg border bg-card p-4 text-left transition-colors", sessionId === s.id ? "border-primary ring-1 ring-primary" : "hover:border-primary/40")}>
                <p className="font-semibold">{s.title} <span className="text-xs font-normal text-success">v{s.version} · đã duyệt</span></p>
                <p className="text-xs text-muted-foreground">Lớp {s.className}{s.subject ? ` · ${s.subject}` : ""}</p>
                <ul className="mt-2 space-y-1">{s.groups.map((g) => <li key={g.name} className="text-xs"><b className="font-medium">{g.name}</b> ({g.count} HS){g.competency ? ` — ${g.competency}` : ""}</li>)}</ul>
              </button>
            ))}
          </div>
          <div className="flex justify-end"><Button disabled={!sessionId} onClick={() => setStep(2)}>Tiếp tục: Thiết lập bài học <ArrowRight /></Button></div>
        </>
      )}

      {step === 2 && cur && (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Card className="flex flex-wrap items-center gap-2 p-3 text-sm">
            <span className="text-muted-foreground">Hồ sơ nhóm:</span><b>{cur.title}</b> v{cur.version} · Lớp {cur.className} · {cur.groups.length} nhóm
            <Button type="button" variant="link" size="sm" onClick={() => setStep(1)}>Đổi</Button>
          </Card>
          <Card className="grid gap-4 p-5 sm:grid-cols-[1fr_2fr_auto]">
            <Field label="Môn học" htmlFor="subject" required error={fieldError("subject")}><Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} /></Field>
            <Field label="Bài học" htmlFor="title" required error={fieldError("title")}><Input id="title" name="title" placeholder="Ví dụ: Tây Tiến (Quang Dũng)" /></Field>
            <Field label="Thời lượng (tiết)" htmlFor="periods" required error={fieldError("periods")}><Input id="periods" name="periods" type="number" min={1} max={10} defaultValue={2} className="w-24" /></Field>
            <Field label="Yêu cầu cần đạt" htmlFor="requirements" className="sm:col-span-3" hint="Mỗi dòng một yêu cầu"><Textarea id="requirements" name="requirements" rows={3} /></Field>
            <Field label="Nội dung bài học" htmlFor="content" className="sm:col-span-3" hint="Kiến thức trọng tâm, ngữ liệu, tình huống…"><Textarea id="content" name="content" rows={3} /></Field>
            <Field label="Phương pháp, kĩ thuật dạy học" htmlFor="methods" className="sm:col-span-3"><Input id="methods" name="methods" placeholder="Dạy học hợp tác, dạy học phân hóa, kĩ thuật mảnh ghép…" /></Field>
          </Card>
          {error && <Alert tone="danger">{error}</Alert>}
          <div className="flex justify-between">
            <Button type="button" variant="ghost" onClick={() => setStep(1)}><ArrowLeft /> Quay lại</Button>
            <Button type="submit" disabled={pending}>{pending && <Loader2 className="animate-spin" />} Tạo KHBD & mở trình soạn <ArrowRight /></Button>
          </div>
        </form>
      )}
    </div>
  );
}
