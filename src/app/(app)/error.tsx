"use client";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="Không thể tải trang"
      description={`Đã xảy ra lỗi khi tải dữ liệu. ${error.digest ? `Mã lỗi: ${error.digest}` : ""}`}
      action={<Button onClick={reset}>Thử lại</Button>}
    />
  );
}
