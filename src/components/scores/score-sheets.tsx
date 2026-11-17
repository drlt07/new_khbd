import { weightedAverage } from "@/lib/grouping/match";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { DeleteSheetButton } from "./delete-sheet-button";

type Sheet = { id: string; subject: string; fileName: string; createdAt: Date; _count: { groupings: number }; columns: { id: string; label: string; weight: number; scores: { studentId: string; value: number }[] }[] };
const f1 = (x: number | null | undefined) => (x == null ? "—" : (Math.round(x * 10) / 10).toString().replace(".", ","));

export function ScoreSheets({ sheets, students }: { sheets: Sheet[]; students: { id: string; fullName: string }[] }) {
  return (
    <div className="space-y-3">
      {sheets.map((sh) => {
        const cell = new Map(sh.columns.flatMap((c) => c.scores.map((s) => [`${c.id}:${s.studentId}`, s.value] as const)));
        const has = students.filter((st) => sh.columns.some((c) => cell.has(`${c.id}:${st.id}`)));
        return (
          <Card key={sh.id} className="p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{sh.subject}</h3>
              <span className="text-sm text-muted-foreground">· {sh.fileName} · {formatDate(sh.createdAt)} · {has.length}/{students.length} học sinh có điểm</span>
              <div className="flex-1" />
              <DeleteSheetButton id={sh.id} usedBy={sh._count.groupings} />
            </div>
            <details>
              <summary className="cursor-pointer text-sm text-primary">Xem bảng điểm ({sh.columns.map((c) => `${c.label} ×${c.weight}`).join(", ")})</summary>
              <div className="mt-3 max-h-[420px] overflow-auto rounded-lg border">
                <Table>
                  <THead><TR><TH>Họ và tên</TH>{sh.columns.map((c) => <TH key={c.id} className="text-right">{c.label}</TH>)}<TH className="text-right">TB (hệ số)</TH></TR></THead>
                  <TBody>
                    {has.map((st) => {
                      const vals = sh.columns.map((c) => ({ v: cell.get(`${c.id}:${st.id}`), w: c.weight }));
                      const avg = weightedAverage(vals.filter((x) => x.v != null).map((x) => ({ value: x.v!, weight: x.w })));
                      return <TR key={st.id}><TD className="whitespace-nowrap">{st.fullName}</TD>{vals.map((x, i) => <TD key={i} className="text-right tabular-nums">{f1(x.v)}</TD>)}<TD className="text-right font-semibold tabular-nums">{f1(avg)}</TD></TR>;
                    })}
                  </TBody>
                </Table>
              </div>
            </details>
          </Card>
        );
      })}
    </div>
  );
}
