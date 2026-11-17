"use client";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export type PickerStudent = { id: string; fullName: string; studentCode: string | null };

/** Chọn nhiều học sinh: tìm kiếm, chọn tất cả / bỏ chọn. */
export function StudentPicker({
  students, value, onChange, id = "student-picker",
}: { students: PickerStudent[]; value: string[]; onChange: (v: string[]) => void; id?: string }) {
  const [q, setQ] = useState("");
  const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();
  const shown = useMemo(
    () => students.filter((s) => !q || fold(`${s.fullName} ${s.studentCode ?? ""}`).includes(fold(q))),
    [students, q],
  );
  const selected = new Set(value);
  const toggle = (sid: string) => onChange(selected.has(sid) ? value.filter((v) => v !== sid) : [...value, sid]);

  if (!students.length) return <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">Lớp chưa có học sinh.</p>;

  return (
    <div className="rounded-lg border">
      <div className="flex items-center gap-2 border-b p-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input id={id} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm học sinh" className="h-8 pl-7" aria-label="Tìm học sinh" />
        </div>
        <button type="button" className="text-xs text-primary hover:underline" onClick={() => onChange([...new Set([...value, ...shown.map((s) => s.id)])])}>
          Chọn {q ? "kết quả" : "tất cả"}
        </button>
        {value.length > 0 && <button type="button" className="text-xs text-muted-foreground hover:underline" onClick={() => onChange([])}>Bỏ chọn</button>}
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 border-b p-2" aria-label="Học sinh đã chọn">
          {students.filter((s) => selected.has(s.id)).map((s) => (
            <span key={s.id} className="inline-flex items-center gap-1 rounded-full bg-primary-soft py-0.5 pl-2 pr-1 text-xs font-medium text-primary">
              {s.fullName}
              <button type="button" onClick={() => toggle(s.id)} aria-label={`Bỏ chọn ${s.fullName}`} className="rounded-full p-0.5 hover:bg-primary/10">
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <ul className="max-h-56 overflow-y-auto p-1" role="group" aria-label="Danh sách học sinh">
        {shown.map((s) => (
          <li key={s.id}>
            <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
              <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={selected.has(s.id)} onChange={() => toggle(s.id)} />
              <span className="flex-1">{s.fullName}</span>
              {s.studentCode && <span className="text-xs text-muted-foreground">{s.studentCode}</span>}
            </label>
          </li>
        ))}
        {!shown.length && <li className="px-2 py-1.5 text-sm text-muted-foreground">Không tìm thấy</li>}
      </ul>
      <p className="border-t px-3 py-1.5 text-xs text-muted-foreground">Đã chọn {value.length}/{students.length} học sinh</p>
    </div>
  );
}
