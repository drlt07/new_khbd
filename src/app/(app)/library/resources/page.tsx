import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { listResources } from "@/server/services/resource.service";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ResourceManager } from "@/components/library/resource-manager";

export const metadata: Metadata = { title: "Học liệu & tài nguyên" };

export default async function ResourcesPage() {
  const user = await requireUser();
  const items = await listResources(user.userId);
  return (
    <PageContainer>
      <PageHeader title="Học liệu & tài nguyên" description="Kho học liệu cá nhân: phiếu học tập, bài đọc, video, trình chiếu… dùng lại cho nhiệm vụ của các nhóm." />
      <ResourceManager items={items} />
    </PageContainer>
  );
}
