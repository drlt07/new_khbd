"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { useMutation } from "@/hooks/use-mutation";

type G = { id: string; title: string; subject: string | null; groups: { name: string; count: number }[] };

export function NewLessonForm({ classId, groupings, defaultGroupingId }: { classId: string; groupings: G[]; defaultGroupingId?: string }) {
  const router = useRouter();
  const [groupingId, setGroupingId] = useState(groupings.find((g) => g.id === defaultGroupingId)?.id ?? groupings[0]?.id ?? "");
  const current = groupings.find((g) => g.id === groupingId);
  const [subject, setSubject] = useState(current?.subject ?? "");
  const { mutate, pending, error, fieldError } = useMutation();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget));
    const res = await mutate<{ id: string }>("/api/lessons", "POST", { ...fd, groupingId, subject }, { refresh: false });
    if (res.ok) { router.push(`/classes/${classId}/lessons/${res.data.id}`); router.refresh(); }
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <Card className="space-y-3 p-5">
        <Field label="Bộ nhóm từ Pha 1" htmlFor="grouping" required error={fieldError("groupingId")}>
          <Select id="grouping" value={groupingId} onChange={(e) => { setGroupingId(e.target.value); const g = groupings.find((x) => x.id === e.target.value); if (g?.subject && !subject) setSubject(g.subject); }}>
            {groupings.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
          </Select>
        </Field>
        {current && (
          <div className="flex flex-wrap gap-1.5">
            {current.groups.map((g) => <span key={g.name} className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs text-primary">{g.name} · {g.count} HS</span>)}
          </div>
        )}
      </Card>

      <Card className="grid gap-4 p-5 sm:grid-cols-[1fr_2fr_auto]">
        <Field label="Môn học" htmlFor="subject" required error={fieldError("subject")}>
          <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ngữ văn" />
        </Field>
        <Field label="Tên bài học" htmlFor="title" required error={fieldError("title")}>
          <Input id="title" name="title" placeholder="Ví dụ: Tây Tiến (Quang Dũng)" />
        </Field>
        <Field label="Số tiết" htmlFor="periods" required error={fieldError("periods")}>
          <Input id="periods" name="periods" type="number" min={1} max={10} defaultValue={2} className="w-20" />
        </Field>
        <Field label="Yêu cầu cần đạt" htmlFor="requirements" className="sm:col-span-3" hint="Mỗi dòng một yêu cầu. Dòng đầu tiên được dùng làm trọng tâm khi gợi ý nhiệm vụ.">
          <Textarea id="requirements" name="requirements" rows={3} placeholder="Phân tích được hình tượng người lính Tây Tiến..." />
        </Field>
        <Field label="Kiến thức" htmlFor="knowledgeGoals"><Textarea id="knowledgeGoals" name="knowledgeGoals" rows={3} /></Field>
        <Field label="Năng lực" htmlFor="competencyGoals"><Textarea id="competencyGoals" name="competencyGoals" rows={3} /></Field>
        <Field label="Phẩm chất" htmlFor="qualityGoals"><Textarea id="qualityGoals" name="qualityGoals" rows={3} /></Field>
        <Field label="Thiết bị dạy học và học liệu" htmlFor="materials" className="sm:col-span-3"><Textarea id="materials" name="materials" rows={2} placeholder="SGK, phiếu học tập, máy chiếu..." /></Field>
      </Card>

      {error && <Alert tone="danger">{error}</Alert>}
      <div className="flex flex-col items-end gap-1">
        <Button type="submit" size="lg" disabled={pending || !groupingId}>{pending ? <Loader2 className="animate-spin" /> : <Sparkles />} Tạo KHBD với nhiệm vụ cho {current?.groups.length ?? 0} nhóm</Button>
        <p className="text-xs text-muted-foreground">Hệ thống dựng khung 4 hoạt động (CV 5512) và gợi ý nhiệm vụ riêng cho từng nhóm theo đặc trưng — thầy cô chỉnh ở bước sau.</p>
      </div>
    </form>
  );
}
