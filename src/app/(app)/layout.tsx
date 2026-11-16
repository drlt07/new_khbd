import { requireSession } from "@/lib/auth/session";
import { getAIConfig } from "@/server/ai/config";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const ai = getAIConfig();
  return (
    <AppShell user={{ name: session.name, email: session.email, role: session.role }} aiMode={{ isMock: ai.isMock, provider: ai.provider }}>
      {children}
    </AppShell>
  );
}
