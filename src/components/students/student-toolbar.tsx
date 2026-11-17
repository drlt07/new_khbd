"use client";
import { useState } from "react";
import { FileSpreadsheet, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudentFormDialog, type TraitSuggestions } from "./student-form-dialog";
import { ImportStudentsDialog } from "./import-students-dialog";

type ClassOpt = { id: string; name: string; schoolYear: string };

export function StudentToolbar({ classes, defaultClassId, suggestions }: { classes: ClassOpt[]; defaultClassId?: string; suggestions: TraitSuggestions }) {
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const disabled = classes.length === 0;
  const title = disabled ? "Hãy tạo lớp học trước" : undefined;
  return (
    <>
      <Button variant="outline" onClick={() => setImportOpen(true)} disabled={disabled} title={title}><FileSpreadsheet /> Nhập từ Excel</Button>
      <Button variant="outline" onClick={() => setAddOpen(true)} disabled={disabled} title={title}><UserPlus /> Thêm học sinh</Button>
      {addOpen && <StudentFormDialog open onOpenChange={setAddOpen} classes={classes} defaultClassId={defaultClassId} suggestions={suggestions} />}
      {importOpen && <ImportStudentsDialog open onOpenChange={setImportOpen} classes={classes} defaultClassId={defaultClassId} />}
    </>
  );
}
