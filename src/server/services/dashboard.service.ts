import "server-only";
import { prisma } from "@/lib/prisma";
import { percent } from "@/lib/utils";

export type DashboardStats = Awaited<ReturnType<typeof getDashboardStats>>;

/**
 * Số liệu Dashboard — luôn giới hạn theo các lớp mà giáo viên sở hữu
 * (phân quyền theo dữ liệu, không chỉ theo route).
 */
export async function getDashboardStats(teacherId: string) {
  const classWhere = { ownerId: teacherId, isArchived: false };
  const studentWhere = { class: classWhere };

  const [
    classCount,
    studentCount,
    confirmedProfiles,
    pendingProfiles,
    needsDataProfiles,
    lessonPlanCount,
    pendingRecommendations,
    recentLessonPlans,
    classes,
  ] = await Promise.all([
    prisma.class.count({ where: classWhere }),
    prisma.student.count({ where: studentWhere }),
    prisma.student.count({ where: { ...studentWhere, profileStatus: "CONFIRMED" } }),
    prisma.student.count({ where: { ...studentWhere, profileStatus: "PENDING_REVIEW" } }),
    prisma.student.count({ where: { ...studentWhere, profileStatus: "NEEDS_MORE_DATA" } }),
    prisma.lessonPlan.count({ where: { teacherId, status: { not: "ARCHIVED" } } }),
    prisma.aIRecommendation.count({ where: { reviewStatus: "PENDING", student: studentWhere } }),
    prisma.lessonPlan.findMany({
      where: { teacherId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
        isSample: true,
        class: { select: { name: true } },
        subject: { select: { name: true } },
      },
    }),
    prisma.class.findMany({
      where: classWhere,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        schoolYear: true,
        isSample: true,
        _count: { select: { students: true, evidences: true } },
        students: { select: { profileStatus: true } },
      },
    }),
  ]);

  const classProgress = classes.map((c) => {
    const total = c.students.length;
    const confirmed = c.students.filter((s) => s.profileStatus === "CONFIRMED").length;
    const pending = c.students.filter((s) => s.profileStatus === "PENDING_REVIEW").length;
    const notAnalyzed = c.students.filter((s) => s.profileStatus === "NOT_ANALYZED").length;
    return {
      id: c.id,
      name: c.name,
      schoolYear: c.schoolYear,
      isSample: c.isSample,
      studentCount: total,
      evidenceCount: c._count.evidences,
      confirmed,
      pending,
      notAnalyzed,
      progress: percent(confirmed, total),
    };
  });

  return {
    classCount,
    studentCount,
    confirmedProfiles,
    pendingProfiles,
    needsDataProfiles,
    lessonPlanCount,
    pendingRecommendations,
    overallProgress: percent(confirmedProfiles, studentCount),
    recentLessonPlans,
    classProgress,
    hasSampleData: classes.some((c) => c.isSample),
  };
}
