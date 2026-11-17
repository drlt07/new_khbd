import "server-only";
import { prisma } from "@/lib/prisma";

/** Lịch sử hoạt động (kiểu Notion) — không bao giờ làm hỏng luồng chính */
export async function log(userId: string, classId: string | null, action: string, message: string, href?: string) {
  try {
    await prisma.activityLog.create({ data: { userId, classId, action, message, href } });
  } catch (e) {
    console.error("[log]", e);
  }
}

export function recentLogs(userId: string, opts: { classId?: string; take?: number } = {}) {
  return prisma.activityLog.findMany({
    where: { userId, ...(opts.classId ? { classId: opts.classId } : {}) },
    orderBy: { createdAt: "desc" },
    take: opts.take ?? 10,
    include: { class: { select: { name: true } } },
  });
}
