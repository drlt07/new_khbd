"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { NAV_ITEMS } from "@/config/navigation";
import { cn } from "@/lib/utils";

export type SidebarClass = { id: string; name: string; schoolYear: string };

export function SidebarNav({ classes, onNavigate }: { classes: SidebarClass[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const link = (href: string, active: boolean, children: React.ReactNode) => (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
        active ? "bg-primary-soft font-medium text-primary" : "text-slate-600 hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
  return (
    <div className="flex h-full flex-col">
      <Link href="/classes" onClick={onNavigate} className="flex h-16 shrink-0 items-center gap-2.5 border-b px-5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><GraduationCap className="size-4" /></span>
        <span className="leading-tight">
          <span className="block text-sm font-semibold">KHBD cá thể hóa</span>
          <span className="block text-xs text-muted-foreground">Chia nhóm → Soạn bài</span>
        </span>
      </Link>
      <nav className="flex-1 space-y-5 overflow-y-auto p-3" aria-label="Điều hướng chính">
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => link(item.href, pathname === item.href, <><item.icon className="size-4" /> {item.label}</>))}
        </div>
        {classes.length > 0 && (
          <div>
            <p className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Lớp của tôi</p>
            <div className="space-y-0.5">
              {classes.map((c) =>
                link(`/classes/${c.id}`, pathname === `/classes/${c.id}` || pathname.startsWith(`/classes/${c.id}/`), (
                  <>
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-semibold text-slate-600">{c.name.slice(0, 3)}</span>
                    <span className="truncate">Lớp {c.name}</span>
                    <span className="ml-auto text-[11px] text-muted-foreground">{c.schoolYear.slice(2, 4)}–{c.schoolYear.slice(7)}</span>
                  </>
                )),
              )}
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
