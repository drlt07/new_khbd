"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";

export function AppShell({ user, engine, children }: { user: { name: string; email: string }; engine: { kind: "claude" | "rules"; label: string }; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  // Chế độ tập trung (kiểu Canva): trình soạn KHBD dùng toàn bộ chiều rộng, sidebar thu vào menu
  const focus = /^\/phase2\/(?!new)[^/]+$/.test(usePathname());
  return (
    <div className={focus ? "min-h-screen" : "min-h-screen lg:pl-64 print:pl-0"}>
      {!focus && <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r lg:block print:hidden"><SidebarNav engine={engine} /></aside>}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur sm:px-6 print:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className={focus ? "rounded-lg p-2 hover:bg-muted" : "rounded-lg p-2 hover:bg-muted lg:hidden"} aria-label="Mở menu"><Menu className="size-5" /></SheetTrigger>
          <SheetContent aria-describedby={undefined} className="w-72 p-0">
            <SheetTitle className="sr-only">Menu điều hướng</SheetTitle>
            <SidebarNav engine={engine} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <div id="header-slot" className="min-w-0 flex-1" />
        <UserMenu name={user.name} email={user.email} />
      </header>
      <main className="w-full print:p-0">{children}</main>
    </div>
  );
}
