"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useMutation } from "@/hooks/use-mutation";

/** Sửa một trường văn bản của hồ sơ (tóm tắt / nhận xét chung của giáo viên). */
export function ProfileTextForm({
  studentId, field, value, placeholder,
}: { studentId: string; field: "summary" | "teacherComment"; value: string | null; placeholder: string }) {
  const [text, setText] = useState(value ?? "");
  const { mutate, pending, error } = useMutation();
  const dirty = text !== (value ?? "");
  return (
    <div className="space-y-2">
      <Textarea aria-label={placeholder} value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} rows={4} />
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex justify-end gap-2">
        {dirty && <Button variant="ghost" size="sm" onClick={() => setText(value ?? "")}>Hoàn tác</Button>}
        <Button size="sm" disabled={!dirty || pending} onClick={() => mutate(`/api/students/${studentId}/profile`, "PATCH", { [field]: text })}>
          {pending && <Loader2 className="animate-spin" />} Lưu
        </Button>
      </div>
    </div>
  );
}
