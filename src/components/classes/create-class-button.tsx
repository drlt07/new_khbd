"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClassFormDialog } from "./class-form-dialog";

export function CreateClassButton({ subjectSuggestions }: { subjectSuggestions: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}><Plus /> Tạo lớp học</Button>
      {open && <ClassFormDialog open={open} onOpenChange={setOpen} subjectSuggestions={subjectSuggestions} />}
    </>
  );
}
