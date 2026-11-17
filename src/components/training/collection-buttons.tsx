"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { useMutation } from "@/hooks/use-mutation";
import { CollectionFormDialog } from "./collection-form-dialog";

type Subjects = { id: string; name: string }[];

export function CreateCollectionButton({ subjects }: { subjects: Subjects }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}><Plus /> Tạo bộ tài liệu</Button>
      {open && <CollectionFormDialog open onOpenChange={setOpen} subjects={subjects} />}
    </>
  );
}

export function CollectionActions({
  subjects, collection,
}: { subjects: Subjects; collection: { id: string; name: string; description: string | null; subjectId: string | null; gradeLevel: number | null } }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const del = useMutation();
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}><Pencil /> Sửa</Button>
      <ConfirmButton
        variant="outline"
        className="text-danger"
        title={`Xóa bộ “${collection.name}”?`}
        description="Toàn bộ tài liệu, tệp gốc và chỉ mục tìm kiếm của bộ này sẽ bị xóa. AI sẽ không còn dùng các tài liệu này làm tham chiếu."
        confirmLabel="Xóa bộ tài liệu"
        onConfirm={async () => {
          const r = await del.mutate(`/api/training/collections/${collection.id}`, "DELETE", undefined, { refresh: false });
          if (r.ok) router.push("/training");
          return r;
        }}
      >
        <Trash2 /> Xóa
      </ConfirmButton>
      {open && <CollectionFormDialog open onOpenChange={setOpen} subjects={subjects} initial={collection} />}
    </>
  );
}
