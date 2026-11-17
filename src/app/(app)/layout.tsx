import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();
  const classes = await prisma.class.findMany({
    where: { ownerId: session.userId },
    orderBy: [{ schoolYear: "desc" }, { name: "asc" }],
    select: { id: true, name: true, schoolYear: true },
  });
  return <AppShell user={{ name: session.name, email: session.email }} classes={classes}>{children}</AppShell>;
}
