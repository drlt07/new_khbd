import { requireUser } from "@/lib/auth/session";
import { getEngine } from "@/server/ai/engine";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();
  const e = getEngine();
  return <AppShell user={{ name: session.name, email: session.email }} engine={{ kind: e.kind, label: e.label }}>{children}</AppShell>;
}
