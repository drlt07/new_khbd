"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Bot, Loader2, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useMutation } from "@/hooks/use-mutation";
import { checkGrouping } from "@/lib/grouping/check";
import type { MStudent } from "@/lib/grouping/match";
import { formatDate } from "@/lib/utils";
import { CheckPanel } from "./check-panel";
import { StepFooter } from "./step-footer";

export type StepGroup = {
  id: string; name: string; description: string; keywords: string[]; scoreMin: number | null; scoreMax: number | null; forSupport: boolean; maxSize: number | null;
  criteria: { scoreMin?: number | null; scoreMax?: number | null; keywords?: string[]; forSupport?: boolean; source?: string[] } | null;
  competency: string | null; strengths: string[]; difficulties: string[]; needs: string | null; supportGoal: string | null; avgScore: number | null;
  members: { studentId: string; reason: string | null; fit: string | null }[];
};

const FIT: Record<string, { label: string; tone: "success" | "info" | "neutral" | "warning" }> = {
  good: { label: "Phù hợp", tone: "success" }, partial: { label: "Phù hợp một phần", tone: "info" }, none: { label: "Chưa đủ căn cứ", tone: "neutral" }, manual: { label: "GV điều chỉnh", tone: "warning" },
};
export const fitBadge = (fit: string | null) => { const f = FIT[fit ?? "none"] ?? FIT.none; return <Badge tone={f.tone}>{f.label}</Badge>; };
const f1 = (x: number | null) => (x == null ? "—" : (Math.round(x * 10) / 10).toString().replace(".", ","));

/** Tiêu chí hiệu lực đã lưu (diễn giải + GV đặt) để kiểm tra */
export const specOf = (g: StepGroup) => ({
  name: g.name, keywords: g.criteria?.keywords ?? g.keywords, scoreMin: g.criteria?.scoreMin ?? g.scoreMin, scoreMax: g.criteria?.scoreMax ?? g.scoreMax,
  forSupport: g.criteria?.forSupport ?? g.forSupport, maxSize: g.maxSize,
});

export function StepAnalysis({ id, readOnly, engine, engineNow, analyzedAt, groups, students }: {
  id: string; readOnly: boolean; engine: string | null; engineNow: { kind: string; label: string; detail: string }; analyzedAt: string | null; groups: StepGroup[]; students: MStudent[];
}) {
  const router = useRouter();
  const { mutate, pending, error } = useMutation();
  const byId = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);
  const check = useMemo(() => checkGrouping(groups.map((g) => ({ ...specOf(g), members: g.members.map((m) => m.studentId) })), students, students.map((s) => s.id)), [groups, students]);
  const max = Math.max(1, ...groups.map((g) => g.members.length));
  const usedClaude = engine?.startsWith("claude");

  return (
    <div className="space-y-5">
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary"><Bot className="size-5" /></span>
        <div className="flex-1">
          <p className="font-semibold">{usedClaude ? "Claude AI đã phân tích và phân bổ học sinh" : "Bộ máy quy tắc đã phân bổ học sinh"}</p>
          <p className="text-xs text-muted-foreground">
            {analyzedAt ? `Lúc ${formatDate(analyzedAt, true)} · ` : ""}
            {engine?.includes("fallback") ? "AI gặp lỗi nên đã dùng bộ máy quy tắc dự phòng. " : ""}
            {usedClaude ? "Dữ liệu gửi AI đã ẩn danh (HS01…)." : engineNow.kind === "rules" ? "Chưa cấu hình Claude API — dùng quy tắc: mô tả nhóm + điểm theo phân bố lớp + đặc trưng học sinh." : ""}
          </p>
        </div>
        {!readOnly && <Button variant="outline" onClick={() => mutate(`/api/sessions/${id}/analyze`, "POST")} disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : <RefreshCw />} Chạy lại phân tích</Button>}
      </Card>
      {error && <Alert tone="danger">{error}</Alert>}

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <CheckPanel fitRate={check.fitRate} issues={check.issues} />
        <Card className="p-4">
          <p className="mb-3 text-sm font-semibold">Phân bố học sinh theo nhóm</p>
          <ul className="space-y-2">
            {groups.map((g) => (
              <li key={g.id} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-2 text-sm">
                <span className="truncate" title={g.name}>{g.name}</span>
                <span className="h-2.5 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-primary" style={{ width: `${(g.members.length / max) * 100}%` }} /></span>
                <span className="w-14 text-right tabular-nums text-muted-foreground">{g.members.length} HS</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">Sĩ số không bắt buộc bằng nhau — phụ thuộc mô tả nhóm và dữ liệu thực tế của lớp.</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b p-4"><p className="font-semibold">Giải thích phân bổ</p><p className="text-xs text-muted-foreground">Lý do dựa trên điểm số và đặc trưng thật của từng học sinh. Chỉnh sửa ở bước Duyệt nhóm.</p></div>
        <Table>
          <THead><TR><TH>Học sinh</TH><TH>Nhóm</TH><TH className="text-right">Điểm TB</TH><TH>Mức phù hợp</TH><TH>Lý do</TH></TR></THead>
          <TBody>
            {groups.flatMap((g) => g.members.map((m) => {
              const s = byId.get(m.studentId);
              return (
                <TR key={m.studentId}>
                  <TD className="whitespace-nowrap font-medium">{s?.fullName}</TD>
                  <TD className="whitespace-nowrap">{g.name}</TD>
                  <TD className="text-right tabular-nums">{f1(s?.score ?? null)}</TD>
                  <TD>{fitBadge(m.fit)}</TD>
                  <TD className="min-w-64 text-xs text-muted-foreground">{m.reason}</TD>
                </TR>
              );
            }))}
          </TBody>
        </Table>
      </Card>

      <StepFooter hint="Tiếp theo: xem hồ sơ từng nhóm, chuyển học sinh nếu cần và xác nhận.">
        <Button onClick={() => router.push(`/phase1/${id}?step=4`)}>Tiếp tục: Duyệt nhóm <ArrowRight /></Button>
      </StepFooter>
    </div>
  );
}
