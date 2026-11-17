import { requireUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();
  return <AppShell user={{ name: session.name, email: session.email }}>{children}</AppShell>;
}
