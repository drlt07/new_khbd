"use client";
import { useState } from "react";
import { Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SampleBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useMutation } from "@/hooks/use-mutation";
import { TraitChips } from "./trait-chips";
import { StudentFormDialog, type StudentFormValues, type TraitSuggestions } from "./student-form-dialog";

export type StudentRow = StudentFormValues & { id: string; className: string; isSample: boolean };

export function StudentTable({
  students, classes, suggestions, showClass = true, emptyHint,
}: {
  students: StudentRow[];
  classes: { id: string; name: string; schoolYear: string }[];
  suggestions: TraitSuggestions;
  showClass?: boolean;
  emptyHint?: string;
}) {
  const [editing, setEditing] = useState<StudentRow | null>(null);
  const { mutate } = useMutation();
  if (!students.length) return <EmptyState icon={Users} title="Chưa có học sinh" description={emptyHint ?? "Thêm học sinh hoặc nhập từ Excel."} />;
  return (
    <>
      <Table>
        <THead>
          <tr><TH>Họ và tên</TH>{showClass && <TH>Lớp</TH>}<TH>Sở thích · Thế mạnh · Cần hỗ trợ</TH><TH className="w-24"><span className="sr-only">Thao tác</span></TH></tr>
        </THead>
        <TBody>
          {students.map((s) => (
            <TR key={s.id}>
              <TD className="whitespace-nowrap">
                <button type="button" className="font-medium hover:text-primary hover:underline" onClick={() => setEditing(s)}>{s.fullName}</button>
                {s.studentCode && <span className="ml-1.5 text-xs text-muted-foreground">{s.studentCode}</span>}
                {s.isSample && <span className="ml-2"><SampleBadge /></span>}
              </TD>
              {showClass && <TD>{s.className}</TD>}
              <TD><TraitChips interests={s.interests} strengths={s.strengths} needs={s.needs} /></TD>
              <TD>
                <div className="flex justify-end">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(s)} aria-label={`Sửa ${s.fullName}`}><Pencil /></Button>
                  <ConfirmButton size="icon" variant="ghost" className="text-danger" aria-label={`Xóa ${s.fullName}`} title={`Xóa ${s.fullName}?`}
                    description="Học sinh sẽ bị xóa khỏi lớp và khỏi các kết quả chia nhóm." confirmLabel="Xóa"
                    onConfirm={() => mutate(`/api/students/${s.id}`, "DELETE")}><Trash2 /></ConfirmButton>
                </div>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
      {editing && <StudentFormDialog key={editing.id} open onOpenChange={(o) => !o && setEditing(null)} initial={editing} classes={classes} suggestions={suggestions} />}
    </>
  );
}
