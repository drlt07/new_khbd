import "server-only";
import { prisma } from "@/lib/prisma";
import { recentLogs } from "./log.service";

export async function getDashboard(userId: string) {
  const owner = { ownerId: userId };
  const [classes, draftSessions, lessonsInProgress, outdatedLessons, logs, counts] = await Promise.all([
    prisma.class.findMany({
      where: owner, orderBy: { updatedAt: "desc" }, take: 6,
      select: {
        id: true, name: true, schoolYear: true, isSample: true, updatedAt: true,
        _count: { select: { students: true } },
        groupings: { select: { status: true, step: true } },
      },
    }),
    prisma.groupingSession.findMany({ where: { class: owner, status: "DRAFT" }, orderBy: { updatedAt: "desc" }, include: { class: { select: { name: true } } } }),
    prisma.lessonPlan.findMany({ where: { session: { class: owner }, status: { in: ["DRAFT", "REVIEW"] } }, orderBy: { updatedAt: "desc" }, take: 8, include: { session: { select: { status: true, class: { select: { name: true } } } }, _count: { select: { activities: true } } } }),
    prisma.lessonPlan.findMany({ where: { session: { class: owner, status: "SUPERSEDED" } }, select: { id: true, title: true, session: { select: { class: { select: { name: true } } } } } }),
    recentLogs(userId, { take: 8 }),
    Promise.all([
      prisma.student.count({ where: { class: owner } }),
      prisma.groupingSession.count({ where: { class: owner, status: "CONFIRMED" } }),
      prisma.lessonPlan.count({ where: { session: { class: owner } } }),
      prisma.lessonPlan.count({ where: { session: { class: owner }, status: "DONE" } }),
    ]),
  ]);
  const lessonCountByClass = new Map(
    (await prisma.groupingSession.findMany({ where: { class: owner }, select: { classId: true, _count: { select: { lessonPlans: true } } } }))
      .reduce((m, s) => m.set(s.classId, (m.get(s.classId) ?? 0) + s._count.lessonPlans), new Map<string, number>()),
  );
  const review = [
    ...draftSessions.filter((s) => s.step >= 3).map((s) => ({ kind: "session" as const, id: s.id, title: `Duyệt nhóm: ${s.title} (v${s.version})`, sub: `Lớp ${s.class.name} · AI đã phân nhóm, chờ giáo viên duyệt`, href: `/phase1/${s.id}?step=4` })),
    ...outdatedLessons.map((l) => ({ kind: "outdated" as const, id: l.id, title: `Cập nhật KHBD: ${l.title}`, sub: `Lớp ${l.session.class.name} · hồ sơ nhóm đã có phiên bản mới`, href: `/phase2/${l.id}` })),
    ...lessonsInProgress.filter((l) => l.status === "REVIEW").map((l) => ({ kind: "lesson" as const, id: l.id, title: `Duyệt KHBD: ${l.title}`, sub: `Lớp ${l.session.class.name} · đang chờ duyệt`, href: `/phase2/${l.id}` })),
  ];
  return {
    stats: { classes: classes.length, students: counts[0], confirmedSessions: counts[1], lessons: counts[2], lessonsDone: counts[3] },
    classes: classes.map((c) => ({
      ...c,
      phase1: c.groupings.some((g) => g.status === "CONFIRMED") ? "done" : c.groupings.length ? "doing" : "todo",
      lessons: lessonCountByClass.get(c.id) ?? 0,
    })),
    inProgress: [
      ...draftSessions.map((s) => ({ kind: "phase1" as const, id: s.id, title: s.title, cls: s.class.name, step: s.step, total: 4, updatedAt: s.updatedAt, href: `/phase1/${s.id}?step=${s.step}` })),
      ...lessonsInProgress.map((l) => ({ kind: "phase2" as const, id: l.id, title: l.title, cls: l.session.class.name, step: l._count.activities ? (l.status === "REVIEW" ? 3 : 2) : 1, total: 3, updatedAt: l.updatedAt, href: `/phase2/${l.id}` })),
    ].sort((a, b) => +b.updatedAt - +a.updatedAt).slice(0, 8),
    review,
    logs,
  };
}
export type Dashboard = Awaited<ReturnType<typeof getDashboard>>;
