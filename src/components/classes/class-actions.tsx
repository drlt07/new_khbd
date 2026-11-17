"use client";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { useMutation } from "@/hooks/use-mutation";

export function DeleteClassButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const { mutate } = useMutation();
  return (
    <ConfirmButton variant="outline" className="text-danger" title={`Xóa lớp ${name}?`}
      description="Toàn bộ học sinh và kết quả chia nhóm của lớp sẽ bị xóa. Thao tác không thể hoàn tác." confirmLabel="Xóa lớp"
      onConfirm={async () => {
        const r = await mutate(`/api/classes/${id}`, "DELETE", undefined, { refresh: false });
        if (r.ok) { router.push("/classes"); router.refresh(); }
        return r;
      }}>
      <Trash2 /> Xóa
    </ConfirmButton>
  );
}
