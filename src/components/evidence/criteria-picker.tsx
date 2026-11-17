"use client";
import type { ProfileDimension } from "@prisma/client";
import { DIMENSION_LABEL } from "@/lib/labels";
import { DIMENSION_ORDER } from "@/config/default-framework";

export type PickerCriteria = { id: string; name: string; dimension: ProfileDimension };

/** Chọn tiêu chí theo nhóm phương diện A–F. */
export function CriteriaPicker({ criteria, value, onChange }: { criteria: PickerCriteria[]; value: string[]; onChange: (v: string[]) => void }) {
  const selected = new Set(value);
  const toggle = (id: string) => onChange(selected.has(id) ? value.filter((v) => v !== id) : [...value, id]);
  return (
    <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border p-1">
      {DIMENSION_ORDER.map((d) => {
        const items = criteria.filter((c) => c.dimension === d);
        if (!items.length) return null;
        const count = items.filter((c) => selected.has(c.id)).length;
        return (
          <details key={d} className="group rounded-md" open={count > 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted">
              {DIMENSION_LABEL[d]}
              {count > 0 && <span className="rounded-full bg-primary-soft px-1.5 text-xs text-primary">{count}</span>}
            </summary>
            <ul className="pb-1 pl-3">
              {items.map((c) => (
                <li key={c.id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted">
                    <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={selected.has(c.id)} onChange={() => toggle(c.id)} />
                    {c.name}
                  </label>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </div>
  );
}
