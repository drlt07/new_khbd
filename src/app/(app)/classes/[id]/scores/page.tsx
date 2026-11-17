import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sheet } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { weightedAverage } from "@/lib/grouping/match";
import { listScoreSheets } from "@/server/services/score.service";
import { ScoreUpload } from "@/components/scores/score-upload";
import { DeleteSheetButton } from "@/components/scores/delete-sheet-button";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Bảng điểm" };

const f1 = (x: number | null | undefined) => (x == null ? "—" : (Math.round(x * 10) / 10).toString().replace(".", ","));

export default async function ScoresPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;
  const [sheets, students] = await Promise.all([
    listScoreSheets(session.userId, id),
    prisma.student.findMany({ where: { classId: id }, orderBy: { fullName: "asc" }, select: { id: true, fullName: true } }),
  ]);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Bước 2 của Pha 1 (không bắt buộc). Điểm chỉ được dùng khi thầy cô đặt <b>khoảng điểm</b> cho nhóm — ví dụ nhóm “Củng cố” dành cho học sinh dưới 6,5.</p>
      <ScoreUpload classId={id} studentCount={students.length} />
      {sheets.length === 0 ? (
        <EmptyState icon={Sheet} title="Chưa có bảng điểm" description="Có thể bỏ qua bước này nếu thầy cô chỉ chia nhóm theo sở thích, thế mạnh, nhu cầu hỗ trợ." />
      ) : (
        sheets.map((sh) => {
          const cell = new Map(sh.columns.flatMap((c) => c.scores.map((s) => [`${c.id}:${s.studentId}`, s.value] as const)));
          const has = students.filter((st) => sh.columns.some((c) => cell.has(`${c.id}:${st.id}`)));
          return (
            <Card key={sh.id} className="p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h2 className="font-semibold">{sh.subject}</h2>
                <span className="text-sm text-muted-foreground">· {sh.fileName} · tải lên {formatDate(sh.createdAt)} · {has.length}/{students.length} học sinh có điểm</span>
                <div className="flex-1" />
                <DeleteSheetButton id={sh.id} usedBy={sh._count.groupings} />
              </div>
              <details>
                <summary className="cursor-pointer text-sm text-primary">Xem bảng điểm ({sh.columns.length} cột: {sh.columns.map((c) => `${c.label} ×${c.weight}`).join(", ")})</summary>
                <div className="mt-3 max-h-[480px] overflow-auto rounded-lg border">
                  <Table>
                    <THead><TR><TH>Họ và tên</TH>{sh.columns.map((c) => <TH key={c.id} className="text-right">{c.label}</TH>)}<TH className="text-right">TB (hệ số)</TH></TR></THead>
                    <TBody>
                      {has.map((st) => {
                        const vals = sh.columns.map((c) => ({ v: cell.get(`${c.id}:${st.id}`), w: c.weight }));
                        const avg = weightedAverage(vals.filter((x) => x.v != null).map((x) => ({ value: x.v!, weight: x.w })));
                        return (
                          <TR key={st.id}>
                            <TD className="whitespace-nowrap">{st.fullName}</TD>
                            {vals.map((x, i) => <TD key={i} className="text-right tabular-nums">{f1(x.v)}</TD>)}
                            <TD className="text-right font-semibold tabular-nums">{f1(avg)}</TD>
                          </TR>
                        );
                      })}
                    </TBody>
                  </Table>
                </div>
              </details>
            </Card>
          );
        })
      )}
      <div className="flex justify-end"><Button asChild><Link href={`/classes/${id}/groups`}>Tiếp: Chia nhóm <ArrowRight /></Link></Button></div>
    </div>
  );
}
