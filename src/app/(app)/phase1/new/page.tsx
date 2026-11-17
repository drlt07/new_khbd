import type { Metadata } from "next";
import { Library } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listClasses } from "@/server/services/class.service";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { NewSessionForm } from "@/components/phase1/new-session-form";
import { ClassFormButton } from "@/components/classes/class-form-dialog";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Phiên phân nhóm mới" };

export default async function NewSessionPage({ searchParams }: { searchParams: Promise<{ classId?: string }> }) {
  const session = await requireUser();
  const { classId } = await searchParams;
  const classes = await listClasses(session.userId);
  return (
    <PageContainer className="max-w-4xl">
      <PageHeader crumbs={[{ label: "Phân tích & phân nhóm", href: "/phase1" }, { label: "Phiên mới" }]} title="Phiên phân nhóm mới"
        description="Quy trình 4 bước: Dữ liệu → Tiêu chí → AI phân nhóm → Giáo viên duyệt. Kết quả là Hồ sơ nhóm dùng cho thiết kế KHBD." />
      {classes.length ? <NewSessionForm classes={classes.map((c) => ({ id: c.id, name: c.name, schoolYear: c.schoolYear, students: c._count.students }))} defaultClassId={classId} />
        : <EmptyState icon={Library} title="Chưa có lớp học" action={<ClassFormButton />} />}
    </PageContainer>
  );
}
