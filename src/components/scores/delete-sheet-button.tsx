"use client";
import { Trash2 } from "lucide-react";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { useMutation } from "@/hooks/use-mutation";

export function DeleteSheetButton({ id, usedBy }: { id: string; usedBy: number }) {
  const { mutate } = useMutation();
  return (
    <ConfirmButton variant="ghost" size="sm" className="text-danger" title="Xóa bảng điểm này?"
      description={usedBy ? `Đang được ${usedBy} bộ nhóm sử dụng — các bộ nhóm vẫn giữ nguyên thành viên nhưng không còn hiển thị điểm.` : "Thao tác không thể hoàn tác."}
      confirmLabel="Xóa" onConfirm={() => mutate(`/api/score-sheets/${id}`, "DELETE")}>
      <Trash2 /> Xóa
    </ConfirmButton>
  );
}
