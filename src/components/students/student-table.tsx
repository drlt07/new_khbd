"use client";
import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2, UserRound, Users } from "lucide-react";
import type { ProfileStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { SampleBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/alert";
import { useMutation } from "@/hooks/use-mutation";
import { formatDate } from "@/lib/utils";
import { ProfileStatusBadge } from "./profile-status-badge";
import { StudentFormDialog, type StudentFormValues } from "./student-form-dialog";

export type StudentRow = StudentFormValues & {
  id: string;
  profileStatus: ProfileStatus;
  isSample: boolean;
  className: string;
  counts: { interests: number; strengths: number; learningNeeds: number; evidence: number; observations: number };
};

export function StudentTable({
  students, classes, showClass = true, emptyHint,
}: {
  students: StudentRow[];
  classes: { id: string; name: string; schoolYear: string }[];
  showClass?: boolean;
  emptyHint?: string;
}) {
  const [editing, setEditing] = useState<StudentRow | null>(null);
  const [deleting, setDeleting] = useState<StudentRow | null>(null);
  const { mutate, pending, error, reset } = useMutation();

  if (students.length === 0) {
    return <EmptyState icon={Users} title="Không có học sinh" description={emptyHint ?? "Thêm học sinh thủ công hoặc nhập từ Excel."} />;
  }

  return (
    <>
      <Table>
        <THead>
          <tr>
            <TH>Họ và tên</TH>
            {showClass && <TH>Lớp</TH>}
            <TH className="hidden md:table-cell">Mã HS</TH>
            <TH className="hidden lg:table-cell">Ngày sinh</TH>
            <TH>Trạng thái hồ sơ</TH>
            <TH className="hidden md:table-cell" title="Sở thích · Thế mạnh · Nhu cầu hỗ trợ · Nhận xét">Dữ liệu hồ sơ</TH>
            <TH className="w-12"><span className="sr-only">Thao tác</span></TH>
          </tr>
        </THead>
        <TBody>
          {students.map((s) => (
            <TR key={s.id}>
              <TD>
                <Link href={`/profiles/${s.id}`} className="font-medium hover:text-primary hover:underline">{s.fullName}</Link>
                {s.isSample && <span className="ml-2"><SampleBadge /></span>}
              </TD>
              {showClass && <TD>{s.className}</TD>}
              <TD className="hidden text-muted-foreground md:table-cell">{s.studentCode ?? "—"}</TD>
              <TD className="hidden text-muted-foreground lg:table-cell">{s.dateOfBirth ? formatDate(s.dateOfBirth) : "—"}</TD>
              <TD><ProfileStatusBadge status={s.profileStatus} /></TD>
              <TD className="hidden text-xs text-muted-foreground md:table-cell">
                {s.counts.interests} sở thích · {s.counts.strengths} thế mạnh · {s.counts.learningNeeds} nhu cầu · {s.counts.observations} nhận xét
              </TD>
              <TD>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label={`Thao tác với ${s.fullName}`}><MoreHorizontal /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild><Link href={`/profiles/${s.id}`}><UserRound /> Xem hồ sơ</Link></DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setEditing(s)}><Pencil /> Sửa thông tin</DropdownMenuItem>
                    <DropdownMenuItem className="text-danger" onSelect={() => { reset(); setDeleting(s); }}><Trash2 /> Xóa</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>

      {editing && (
        <StudentFormDialog open onOpenChange={(o) => !o && setEditing(null)} initial={editing} classes={classes} />
      )}
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent title={`Xóa học sinh ${deleting?.fullName ?? ""}?`}>
          <p className="text-sm text-muted-foreground">Hồ sơ, nhận xét và liên kết minh chứng của học sinh sẽ bị xóa. Thao tác không thể hoàn tác.</p>
          {error && <Alert tone="danger" className="mt-3">{error}</Alert>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Hủy</Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={async () => { if ((await mutate(`/api/students/${deleting!.id}`, "DELETE")).ok) setDeleting(null); }}
            >
              Xóa học sinh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
