import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getAIConfig } from "@/server/ai/config";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const ai = getAIConfig();
  // Mục con của Training: mỗi bộ tài liệu theo môn (ví dụ "Ngữ văn 12")
  const collections = session.teacherId
    ? await prisma.knowledgeCollection.findMany({
        where: { ownerId: session.teacherId },
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, gradeLevel: true, subject: { select: { name: true } } },
      })
    : [];
  const trainingLinks = collections.map((c) => ({
    href: `/training/${c.id}`,
    label: c.subject ? `${c.subject.name}${c.gradeLevel ? ` ${c.gradeLevel}` : ""}` : c.name,
    title: c.name,
  }));
  return (
    <AppShell
      user={{ name: session.name, email: session.email, role: session.role }}
      aiMode={{ isMock: ai.isMock, provider: ai.provider }}
      trainingLinks={trainingLinks}
    >
      {children}
    </AppShell>
  );
}
