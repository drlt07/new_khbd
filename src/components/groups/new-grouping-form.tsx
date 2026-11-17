"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Shuffle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { useMutation } from "@/hooks/use-mutation";
import { cn } from "@/lib/utils";
import { METHOD_INFO, type Method } from "./methods";

type ClassOpt = { id: string; name: string; schoolYear: string; students: { id: string; fullName: string }[] };

export function NewGroupingForm({ classes, defaultClassId }: { classes: ClassOpt[]; defaultClassId?: string }) {
  const router = useRouter();
  const { mutate, pending, error, fieldError } = useMutation();
  const [classId, setClassId] = useState(classes.some((c) => c.id === defaultClassId) ? defaultClassId! : classes[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [method, setMethod] = useState<Method>("MIXED");
  const [groupCount, setGroupCount] = useState(4);
  const [absent, setAbsent] = useState<string[]>([]);
  const cls = useMemo(() => classes.find((c) => c.id === classId), [classes, classId]);
  const present = (cls?.students.length ?? 0) - absent.length;
  const size = groupCount > 0 ? present / groupCount : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await mutate<{ id: string }>("/api/groupings", "POST", { classId, title, method, groupCount, excludeStudentIds: absent }, { refresh: false });
    if (res.ok) router.push(`/groups/${res.data.id}`);
  }

  if (!classes.length) return <Alert tone="warning">Chưa có lớp nào có học sinh. Hãy tạo lớp và thêm học sinh trước.</Alert>;

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && <Alert tone="danger">{error}</Alert>}
      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Lớp" htmlFor="g-class" required>
              <Select id="g-class" value={classId} onChange={(e) => { setClassId(e.target.value); setAbsent([]); }}>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.schoolYear}) · {c.students.length} HS</option>)}
              </Select>
            </Field>
            <Field label="Bài học / hoạt động" htmlFor="g-title" error={fieldError("title")} required>
              <Input id="g-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ví dụ: Bài 2 – Tây Tiến: thảo luận nhóm" />
            </Field>
          </div>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium">Cách chia</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {(Object.keys(METHOD_INFO) as Method[]).map((m) => (
                <label key={m} className={cn("cursor-pointer rounded-lg border p-3 transition-colors", method === m ? "border-primary bg-primary-soft/50" : "hover:bg-muted")}>
                  <input type="radio" name="method" value={m} checked={method === m} onChange={() => setMethod(m)} className="sr-only" />
                  <span className="block text-sm font-medium">{METHOD_INFO[m].label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{METHOD_INFO[m].desc}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <Field label="Số nhóm" htmlFor="g-count" error={fieldError("groupCount")}
            hint={present > 0 ? `${present} học sinh có mặt → khoảng ${Math.floor(size)}${size % 1 ? `–${Math.ceil(size)}` : ""} học sinh/nhóm` : undefined}>
            <Input id="g-count" type="number" min={2} max={20} value={groupCount} onChange={(e) => setGroupCount(Number(e.target.value))} className="w-28" />
          </Field>

          {cls && cls.students.length > 0 && (
            <details className="rounded-lg border">
              <summary className="cursor-pointer px-3 py-2 text-sm">Học sinh vắng (không xếp nhóm){absent.length ? ` · ${absent.length}` : ""}</summary>
              <div className="grid max-h-60 gap-x-4 overflow-y-auto px-3 pb-3 sm:grid-cols-2 lg:grid-cols-3">
                {cls.students.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 py-1 text-sm">
                    <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={absent.includes(s.id)}
                      onChange={() => setAbsent(absent.includes(s.id) ? absent.filter((x) => x !== s.id) : [...absent, s.id])} />
                    {s.fullName}
                  </label>
                ))}
              </div>
            </details>
          )}
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending || !title.trim() || present < 2}>
          {pending ? <Loader2 className="animate-spin" /> : <Shuffle />} Chia nhóm
        </Button>
      </div>
    </form>
  );
}
