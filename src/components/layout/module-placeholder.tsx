import Link from "next/link";
import { Construction } from "lucide-react";
import type { NavItem } from "@/config/navigation";
import { PageHeader } from "./page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

/**
 * Trang giữ chỗ TRUNG THỰC cho module chưa triển khai: nói rõ sprint dự kiến,
 * không hiển thị dữ liệu hay nút bấm giả.
 */
export function ModulePlaceholder({ item }: { item: NavItem }) {
  return (
    <>
      <PageHeader title={item.label} description={item.description} />
      <EmptyState
        icon={Construction}
        title={`Module đang được phát triển — dự kiến hoàn thiện ở Sprint ${item.plannedSprint}`}
        description="Cấu trúc dữ liệu cho module này đã có trong cơ sở dữ liệu. Giao diện và nghiệp vụ sẽ được triển khai theo đúng kế hoạch sprint."
        action={
          <Button asChild variant="outline">
            <Link href="/dashboard">Về bảng điều khiển</Link>
          </Button>
        }
      />
    </>
  );
}
