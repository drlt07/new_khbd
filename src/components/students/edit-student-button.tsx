"use client";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudentFormDialog, type StudentFormValues } from "./student-form-dialog";

export function EditStudentButton({ student, classes }: { student: StudentFormValues & { id: string }; classes: { id: string; name: string; schoolYear: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}><Pencil /> Sửa thông tin</Button>
      {open && <StudentFormDialog open onOpenChange={setOpen} initial={student} classes={classes} />}
    </>
  );
}
