"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { useMutation } from "@/hooks/use-mutation";
import { cn } from "@/lib/utils";

export function NewSessionForm({ classes, defaultClassId }: { classes: { id: string; name: string; schoolYear: string; students: number }[]; defaultClassId?: string }) {
  const router = useRouter();
  const [classId, setClassId] = useState(classes.find((c) => c.id === defaultClassId)?.id ?? classes[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const { mutate, pending, error, fieldError } = useMutation();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await mutate<{ id: string }>("/api/sessions", "POST", { classId, title, subject: subject || null }, { refresh: false });
    if (r.ok) { router.push(`/phase1/${r.data.id}?step=1`); router.refresh(); }
  }
  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <Card className="space-y-3 p-5">
        <p className="text-sm font-medium">Chọn lớp học</p>
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Lớp học">
          {classes.map((c) => (
            <button key={c.id} type="button" role="radio" aria-checked={classId === c.id} onClick={() => setClassId(c.id)}
              className={cn("rounded-lg border p-3 text-left", classId === c.id ? "border-primary bg-primary-soft ring-1 ring-primary" : "hover:border-primary/40")}>
              <p className="font-medium">Lớp {c.name}</p><p className="text-xs text-muted-foreground">{c.schoolYear} · {c.students} học sinh</p>
            </button>
          ))}
        </div>
        {fieldError("classId") && <p className="text-xs text-danger">{fieldError("classId")}</p>}
      </Card>
      <Card className="grid gap-4 p-5 sm:grid-cols-[2fr_1fr]">
        <Field label="Tên phiên phân nhóm" htmlFor="title" required error={fieldError("title")} hint="Ví dụ: Nhóm học tập Ngữ văn – Học kỳ I">
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Môn học" htmlFor="subject" hint="Dùng để chọn sẵn bảng điểm cùng môn"><Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ngữ văn" /></Field>
      </Card>
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="flex justify-end"><Button type="submit" disabled={pending || !classId}>{pending && <Loader2 className="animate-spin" />} Bắt đầu: Bước 1 – Dữ liệu <ArrowRight /></Button></div>
    </form>
  );
}
