import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireTeacher } from "@/lib/auth/session";
import { ApiError } from "@/lib/api";
import { getFramework } from "@/server/services/framework.service";
import { listSubjectsForTeacher } from "@/server/services/subject.service";
import { PageHeader } from "@/components/layout/page-header";
import { FrameworkEditor } from "@/components/frameworks/framework-editor";

export const metadata: Metadata = { title: "Chỉnh sửa khung thông tin" };

export default async function FrameworkPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireTeacher();
  const { id } = await params;
  const framework = await getFramework(session.teacherId, id).catch((e) => {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  });
  const subjects = await listSubjectsForTeacher(session.teacherId);
  return (
    <>
      <Link href="/frameworks" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Khung thông tin
      </Link>
      <PageHeader title={framework.name} description="Tiêu chí bị ẩn sẽ không xuất hiện khi nhập hồ sơ, nhưng dữ liệu cũ vẫn được giữ." />
      <FrameworkEditor key={framework.updatedAt.toISOString()} framework={framework} subjects={subjects} />
    </>
  );
}
