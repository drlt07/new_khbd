import { cn } from "@/lib/utils";

/** Khung trang tiêu chuẩn (các màn hình danh sách). Trình soạn KHBD dùng toàn bộ chiều rộng. */
export function PageContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-7xl p-4 sm:p-6", className)}>{children}</div>;
}
