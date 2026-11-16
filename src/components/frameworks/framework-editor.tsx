"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, EyeOff, Eye, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import type { AssessmentCriteria, ProfileDimension } from "@prisma/client";
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
import { DIMENSION_LABEL } from "@/lib/labels";
import { DIMENSION_ORDER } from "@/config/default-framework";
import { cn } from "@/lib/utils";

type Framework = {
  id: string;
  name: string;
  description: string | null;
  subjectId: string | null;
  isDefault: boolean;
  criteria: AssessmentCriteria[];
};

const LETTER: Record<ProfileDimension, string> = {
  INTEREST: "A", STRENGTH: "B", COMPETENCY: "C", LEARNING_NEED: "D", LEARNING_PREFERENCE: "E", DEVELOPMENT_GOAL: "F",
};

export function FrameworkEditor({ framework, subjects }: { framework: Framework; subjects: { id: string; name: string }[] }) {
  const router = useRouter();
  const meta = useMutation();

  async function saveMeta(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await meta.mutate(`/api/frameworks/${framework.id}`, "PATCH", {
      name: fd.get("name"), description: fd.get("description"), subjectId: fd.get("subjectId"),
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      <Card className="h-fit">
        <CardHeader><CardTitle>Thông tin khung</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={saveMeta} className="space-y-4" noValidate>
            {meta.error && <Alert tone="danger">{meta.error}</Alert>}
            <Field label="Tên khung" htmlFor="name" error={meta.fieldError("name")} required>
              <Input id="name" name="name" defaultValue={framework.name} />
            </Field>
            <Field label="Áp dụng cho môn" htmlFor="subjectId">
              <Select id="subjectId" name="subjectId" defaultValue={framework.subjectId ?? ""}>
                <option value="">Mọi môn học</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </Field>
            <Field label="Mô tả" htmlFor="description">
              <Textarea id="description" name="description" defaultValue={framework.description ?? ""} rows={3} />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={meta.pending}>{meta.pending && <Loader2 className="animate-spin" />} Lưu</Button>
              <ConfirmButton
                variant="ghost"
                className="text-danger"
                title="Xóa khung thông tin?"
                description="Các tiêu chí của khung sẽ bị xóa. Mục hồ sơ học sinh đã gắn tiêu chí vẫn được giữ, chỉ mất liên kết tiêu chí."
                confirmLabel="Xóa khung"
                onConfirm={async () => {
                  const r = await meta.mutate(`/api/frameworks/${framework.id}`, "DELETE", undefined, { refresh: false });
                  if (r.ok) router.push("/frameworks");
                  return r;
                }}
              >
                <Trash2 /> Xóa
              </ConfirmButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="min-w-0 space-y-4">
        {DIMENSION_ORDER.map((d) => (
          <DimensionCard key={d} frameworkId={framework.id} dimension={d} criteria={framework.criteria.filter((c) => c.dimension === d)} />
        ))}
      </div>
    </div>
  );
}

function DimensionCard({ frameworkId, dimension, criteria }: { frameworkId: string; dimension: ProfileDimension; criteria: AssessmentCriteria[] }) {
  const { mutate, pending, error, fieldError } = useMutation();
  const [draft, setDraft] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    const r = await mutate(`/api/frameworks/${frameworkId}/criteria`, "POST", { dimension, name: draft });
    if (r.ok) setDraft("");
  }

  const active = criteria.filter((c) => c.isActive).length;
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-sm font-semibold text-primary">{LETTER[dimension]}</span>
        <div className="flex-1">
          <CardTitle>{DIMENSION_LABEL[dimension]}</CardTitle>
          <CardDescription>{active}/{criteria.length} tiêu chí đang dùng</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <Alert tone="danger">{error}</Alert>}
        <ul className="divide-y rounded-lg border">
          {criteria.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">Chưa có tiêu chí.</li>}
          {criteria.map((c) => <CriteriaRow key={c.id} criteria={c} />)}
        </ul>
        <form onSubmit={add} className="flex gap-2">
          <Input
            aria-label={`Thêm tiêu chí cho ${DIMENSION_LABEL[dimension]}`}
            placeholder="Thêm tiêu chí mới…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-invalid={!!fieldError("name")}
          />
          <Button type="submit" variant="secondary" disabled={pending || !draft.trim()}><Plus /> Thêm</Button>
        </form>
        {fieldError("name") && <p className="text-xs text-danger">{fieldError("name")}</p>}
      </CardContent>
    </Card>
  );
}

function CriteriaRow({ criteria }: { criteria: AssessmentCriteria }) {
  const { mutate, pending, error } = useMutation();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(criteria.name);

  async function save() {
    const r = await mutate(`/api/criteria/${criteria.id}`, "PATCH", { name });
    if (r.ok) setEditing(false);
  }

  return (
    <li className={cn("flex items-center gap-2 px-3 py-1.5 text-sm", !criteria.isActive && "bg-muted/50")}>
      {editing ? (
        <>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8" autoFocus aria-label="Tên tiêu chí"
            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }} />
          <Button size="icon" variant="ghost" onClick={save} disabled={pending} aria-label="Lưu"><Check /></Button>
          <Button size="icon" variant="ghost" onClick={() => { setEditing(false); setName(criteria.name); }} aria-label="Hủy"><X /></Button>
        </>
      ) : (
        <>
          <span className={cn("flex-1", !criteria.isActive && "text-muted-foreground line-through")}>{criteria.name}</span>
          {!criteria.isActive && <Badge>Đã ẩn</Badge>}
          <Button size="icon" variant="ghost" onClick={() => setEditing(true)} aria-label={`Sửa ${criteria.name}`}><Pencil /></Button>
          <Button size="icon" variant="ghost" disabled={pending} onClick={() => mutate(`/api/criteria/${criteria.id}`, "PATCH", { isActive: !criteria.isActive })}
            aria-label={criteria.isActive ? `Ẩn ${criteria.name}` : `Dùng lại ${criteria.name}`} title={criteria.isActive ? "Ẩn (không dùng)" : "Dùng lại"}>
            {criteria.isActive ? <EyeOff /> : <Eye />}
          </Button>
          <Button size="icon" variant="ghost" className="text-danger" disabled={pending} onClick={() => mutate(`/api/criteria/${criteria.id}`, "DELETE")} aria-label={`Xóa ${criteria.name}`}>
            <Trash2 />
          </Button>
        </>
      )}
      {error && <span className="text-xs text-danger">{error}</span>}
    </li>
  );
}
