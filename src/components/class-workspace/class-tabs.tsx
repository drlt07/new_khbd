"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CLASS_TABS } from "@/config/navigation";
import { cn } from "@/lib/utils";

/** Thanh tab trong lớp (kiểu Google Classroom), có nhãn Pha 1 / Pha 2 */
export function ClassTabs({ classId, counts }: { classId: string; counts: Record<string, number | undefined> }) {
  const pathname = usePathname();
  const base = `/classes/${classId}`;
  return (
    <nav aria-label="Các mục của lớp" className="-mx-4 mb-6 overflow-x-auto border-b px-4 sm:mx-0 sm:px-0 print:hidden">
      <ul className="flex min-w-max gap-1">
        {CLASS_TABS.map((t, i) => {
          const href = t.slug ? `${base}/${t.slug}` : base;
          const active = t.slug ? pathname === href || pathname.startsWith(`${href}/`) : pathname === base;
          const phase = "phase" in t ? t.phase : undefined;
          const prevPhase = i > 0 && "phase" in CLASS_TABS[i - 1] ? (CLASS_TABS[i - 1] as { phase: number }).phase : undefined;
          return (
            <li key={t.slug} className="flex items-center">
              {phase && phase !== prevPhase && (
                <span className={cn("ml-2 mr-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", phase === 1 ? "bg-info-soft text-info" : "bg-success-soft text-success")}>
                  Pha {phase}
                </span>
              )}
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm transition-colors",
                  active ? "border-primary font-medium text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
                {counts[t.slug] != null && <span className="rounded-full bg-muted px-1.5 text-[11px] tabular-nums text-muted-foreground">{counts[t.slug]}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
