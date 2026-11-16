import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

/** Ghi lịch sử truy cập / chỉnh sửa. Không bao giờ làm hỏng luồng chính nếu ghi log lỗi. */
export async function writeAudit(entry: {
  userId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
}) {
  try {
    await prisma.auditLog.create({ data: { ...entry, userId: entry.userId ?? null } });
  } catch (err) {
    console.error("[audit] failed to write", err);
  }
}
