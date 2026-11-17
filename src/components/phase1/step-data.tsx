"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { TraitChips } from "@/components/students/trait-chips";
import { StudentToolbar } from "@/components/students/student-toolbar";
import type { TraitSuggestions } from "@/components/students/student-form-dialog";
import { ScoreUpload } from "@/components/scores/score-upload";
import { useMutation } from "@/hooks/use-mutation";
import type { MStudent } from "@/lib/grouping/match";
import { cn, formatDate } from "@/lib/utils";
import { StepFooter } from "./step-footer";

const f1 = (x: number | null) => (x == null ? "—" : (Math.round(x * 10) / 10).toString().replace(".", ","));

export function StepData({ id, classId, readOnly, students, sheets, scoreSheetId, classes, suggestions }: {
  id: string; classId: string; readOnly: boolean; students: MStudent[]; sheets: { id: string; subject: string; fileName: string; createdAt: Date }[];
  scoreSheetId: string | null; classes: { id: string; name: string; schoolYear: string }[]; suggestions: TraitSuggestions;
}) {
  const router = useRouter();
  const [upload, setUpload] = useState(false);
  const { mutate, pending, error } = useMutation();
  const withTraits = students.filter((s) => s.interests.length || s.strengths.length || s.needs.length).length;
  const withScore = students.filter((s) => s.score != null).length;

  const choose = (sid: string | null) => mutate(`/api/sessions/${id}`, "PATCH", { scoreSheetId: sid });
  async function next() {
    const r = await mutate(`/api/sessions/${id}`, "PATCH", { scoreSheetId }, { refresh: false });
    if (r.ok) { router.push(`/phase1/${id}?step=2`); router.refresh(); }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {[["Học sinh", students.length, students.length >= 2], ["Có đặc trưng (sở thích/thế mạnh/nhu cầu)", `${withTraits}/${students.length}`, withTraits > 0], ["Có điểm (bảng đang chọn)", `${withScore}/${students.length}`, withScore > 0]].map(([l, v, ok]) => (
          <Card key={String(l)} className="flex items-center gap-3 p-4">
            <span className={cn("flex size-8 items-center justify-center rounded-full", ok ? "bg-success-soft text-success" : "bg-muted text-muted-foreground")}>{ok ? <Check className="size-4" /> : "–"}</span>
            <div><p className="text-xs text-muted-foreground">{l}</p><p className="text-lg font-semibold tabular-nums">{v}</p></div>
          </Card>
        ))}
      </div>

      <Card className="space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><h3 className="font-semibold">Bảng điểm dùng để phân nhóm</h3><p className="text-sm text-muted-foreground">AI dùng điểm trung bình (theo hệ số) để xếp học sinh vào nhóm theo mức năng lực thầy cô mô tả.</p></div>
          {!readOnly && <Button variant="outline" size="sm" onClick={() => setUpload((u) => !u)}><Upload /> Tải bảng điểm mới</Button>}
        </div>
        {upload && !readOnly && <ScoreUpload classId={classId} studentCount={students.length} />}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="Chọn bảng điểm">
          {[{ id: null as string | null, subject: "Không dùng điểm", fileName: "Chỉ dựa vào đặc trưng học sinh", createdAt: null as Date | null }, ...sheets].map((sh) => (
            <button key={sh.id ?? "none"} type="button" role="radio" aria-checked={scoreSheetId === sh.id} disabled={readOnly || pending} onClick={() => choose(sh.id)}
              className={cn("rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed", scoreSheetId === sh.id ? "border-primary bg-primary-soft ring-1 ring-primary" : "hover:border-primary/40")}>
              <p className="text-sm font-medium">{sh.subject}</p>
              <p className="truncate text-xs text-muted-foreground">{sh.fileName}{sh.createdAt ? ` · ${formatDate(sh.createdAt)}` : ""}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div><h3 className="font-semibold">Hồ sơ học sinh</h3><p className="text-sm text-muted-foreground">Nhập từ Excel (Họ và tên, Sở thích, Thế mạnh, Cần hỗ trợ). Nhập lại tệp sẽ cập nhật đặc trưng.</p></div>
          {!readOnly && <div className="flex gap-2"><StudentToolbar classes={classes} defaultClassId={classId} suggestions={suggestions} /></div>}
        </div>
        <div className="max-h-[420px] overflow-auto rounded-lg border">
          <Table>
            <THead><TR><TH>Họ và tên</TH><TH>Đặc trưng</TH><TH className="text-right">Điểm TB</TH></TR></THead>
            <TBody>
              {students.map((s) => (
                <TR key={s.id}><TD className="whitespace-nowrap font-medium">{s.fullName}</TD><TD><TraitChips interests={s.interests} strengths={s.strengths} needs={s.needs} /></TD><TD className="text-right tabular-nums">{f1(s.score)}</TD></TR>
              ))}
            </TBody>
          </Table>
        </div>
      </Card>

      {error && <Alert tone="danger">{error}</Alert>}
      {!readOnly && (
        <StepFooter hint={students.length < 2 ? "Cần ít nhất 2 học sinh để phân nhóm." : withScore === 0 && withTraits === 0 ? "Chưa có điểm và đặc trưng — AI sẽ chỉ chia để cân bằng sĩ số." : "Dữ liệu đã sẵn sàng."}>
          <Button onClick={next} disabled={pending || students.length < 2}>{pending ? <Loader2 className="animate-spin" /> : null} Tiếp tục: Tiêu chí <ArrowRight /></Button>
        </StepFooter>
      )}
    </div>
  );
}
