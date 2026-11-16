"use client";
import { useState } from "react";
import { Menu } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";
import { Badge } from "@/components/ui/badge";

export function AppShell({
  user,
  aiMode,
  children,
}: {
  user: { name: string; email: string; role: UserRole };
  aiMode: { isMock: boolean; provider: string };
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-card lg:block">
        <SidebarNav role={user.role} />
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur sm:px-6">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="rounded-lg p-2 hover:bg-muted lg:hidden" aria-label="Mở menu">
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent aria-describedby={undefined}>
            <SheetTitle className="sr-only">Menu điều hướng</SheetTitle>
            <SidebarNav role={user.role} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="flex-1" />
        <Badge
          tone={aiMode.isMock ? "warning" : "success"}
          title={aiMode.isMock ? "Chưa cấu hình API key — kết quả AI là MÔ PHỎNG và được đánh dấu rõ" : `Đang dùng AI: ${aiMode.provider}`}
        >
          AI: {aiMode.isMock ? "chế độ mô phỏng" : aiMode.provider}
        </Badge>
        <UserMenu name={user.name} email={user.email} role={user.role} />
      </header>

      <main className="mx-auto w-full max-w-7xl p-4 sm:p-6">{children}</main>
    </div>
  );
}
