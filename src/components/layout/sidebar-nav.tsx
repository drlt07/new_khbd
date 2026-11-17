"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { NAV_GROUPS } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function SidebarNav({
  role, onNavigate, subLinks = {},
}: { role: UserRole; onNavigate?: () => void; subLinks?: Record<string, { href: string; label: string; title?: string }[]> }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    (pathname === href || (href !== "/lesson-plans" && pathname.startsWith(`${href}/`)) ||
    (href === "/lesson-plans" && pathname.startsWith("/lesson-plans/") && !pathname.startsWith("/lesson-plans/new"))) &&
    // Mục cha không sáng khi đang ở một mục con
    !(subLinks[href] ?? []).some((l) => pathname === l.href);

  return (
    <div className="flex h-full flex-col">
      <Link href="/dashboard" onClick={onNavigate} className="flex h-16 items-center gap-2.5 border-b px-5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCap className="size-4.5" />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-semibold">AI Lesson Planner</span>
          <span className="block text-xs text-muted-foreground">KHBD cá thể hóa</span>
        </span>
      </Link>
      <nav className="flex-1 space-y-5 overflow-y-auto p-3" aria-label="Điều hướng chính">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((i) => !i.roles || i.roles.includes(role));
          if (!items.length) return null;
          return (
            <div key={group.label}>
              <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{group.label}</p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors",
                          active ? "bg-primary-soft font-medium text-primary" : "text-slate-600 hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <item.icon className="size-4 shrink-0" />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.plannedSprint && (
                          <span className="rounded bg-muted px-1.5 text-[10px] text-muted-foreground" title={`Dự kiến hoàn thiện ở Sprint ${item.plannedSprint}`}>
                            S{item.plannedSprint}
                          </span>
                        )}
                      </Link>
                      {(subLinks[item.href] ?? []).length > 0 && (
                        <ul className="ml-4 mt-0.5 space-y-0.5 border-l pl-2">
                          {subLinks[item.href].map((l) => {
                            const subActive = pathname === l.href || pathname.startsWith(`${l.href}/`);
                            return (
                              <li key={l.href}>
                                <Link
                                  href={l.href}
                                  onClick={onNavigate}
                                  title={l.title}
                                  aria-current={subActive ? "page" : undefined}
                                  className={cn(
                                    "block truncate rounded-md px-2 py-1 text-sm transition-colors",
                                    subActive ? "bg-primary-soft font-medium text-primary" : "text-slate-600 hover:bg-muted hover:text-foreground",
                                  )}
                                >
                                  {l.label}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
