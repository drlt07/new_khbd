"use client";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav, type SidebarClass } from "./sidebar-nav";
import { UserMenu } from "./user-menu";

export function AppShell({ user, classes, children }: { user: { name: string; email: string }; classes: SidebarClass[]; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen lg:pl-60 print:pl-0">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r bg-card lg:block print:hidden">
        <SidebarNav classes={classes} />
      </aside>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur sm:px-6 print:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="rounded-lg p-2 hover:bg-muted lg:hidden" aria-label="Mở menu"><Menu className="size-5" /></SheetTrigger>
          <SheetContent aria-describedby={undefined}>
            <SheetTitle className="sr-only">Menu điều hướng</SheetTitle>
            <SidebarNav classes={classes} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="flex-1" />
        <UserMenu name={user.name} email={user.email} />
      </header>
      <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 print:max-w-none print:p-0">{children}</main>
    </div>
  );
}
