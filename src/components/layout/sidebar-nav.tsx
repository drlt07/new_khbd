"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shuffle } from "lucide-react";
import { NAV_ITEMS } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <Link href="/groups" onClick={onNavigate} className="flex h-16 items-center gap-2.5 border-b px-5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Shuffle className="size-4" /></span>
        <span className="text-sm font-semibold">Chia nhóm học sinh</span>
      </Link>
      <nav className="flex-1 space-y-0.5 p-3" aria-label="Điều hướng chính">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                active ? "bg-primary-soft font-medium text-primary" : "text-slate-600 hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-4" /> {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
