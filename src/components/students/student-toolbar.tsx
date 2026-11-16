"use client";
import { useState } from "react";
import { FileSpreadsheet, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudentFormDialog } from "./student-form-dialog";
import { ImportStudentsDialog } from "./import-students-dialog";

type ClassOpt = { id: string; name: string; schoolYear: string };

export function StudentToolbar({ classes, defaultClassId }: { classes: ClassOpt[]; defaultClassId?: string }) {
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const disabled = classes.length === 0;
  return (
    <>
      <Button variant="outline" onClick={() => setImportOpen(true)} disabled={disabled} title={disabled ? "Hãy tạo lớp học trước" : undefined}>
        <FileSpreadsheet /> Nhập từ Excel
      </Button>
      <Button onClick={() => setAddOpen(true)} disabled={disabled} title={disabled ? "Hãy tạo lớp học trước" : undefined}>
        <UserPlus /> Thêm học sinh
      </Button>
      {addOpen && <StudentFormDialog open={addOpen} onOpenChange={setAddOpen} classes={classes} defaultClassId={defaultClassId} />}
      {importOpen && <ImportStudentsDialog open={importOpen} onOpenChange={setImportOpen} classes={classes} defaultClassId={defaultClassId} />}
    </>
  );
}
