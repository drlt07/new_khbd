import "server-only";
import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import { DEFAULT_CRITERIA } from "@/config/default-framework";
import type { ProfileDimension } from "@prisma/client";
import type { criteriaInputSchema, criteriaUpdateSchema, frameworkCreateSchema, frameworkUpdateSchema } from "@/schemas/framework";
import { assertFrameworkOwner } from "./authz";

const defaultCriteriaData = () =>
  Object.entries(DEFAULT_CRITERIA).flatMap(([dimension, names]) =>
    names.map((name, i) => ({ dimension: dimension as ProfileDimension, name, sortOrder: i })),
  );

/** Mỗi giáo viên luôn có ít nhất một khung (tạo từ khung mặc định ở lần dùng đầu). */
export async function ensureDefaultFramework(teacherId: string) {
  const count = await prisma.assessmentFramework.count({ where: { ownerId: teacherId } });
  if (count > 0) return;
  await prisma.assessmentFramework.create({
    data: {
      ownerId: teacherId,
      name: "Khung thông tin mặc định (A–F)",
      description: "Sao chép từ khung mặc định của hệ thống. Có thể tùy chỉnh, bổ sung hoặc loại bỏ tiêu chí.",
      isDefault: true,
      criteria: { create: defaultCriteriaData() },
    },
  });
}

export async function listFrameworks(teacherId: string) {
  await ensureDefaultFramework(teacherId);
  return prisma.assessmentFramework.findMany({
    where: { ownerId: teacherId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    include: {
      subject: { select: { id: true, name: true } },
      criteria: { select: { dimension: true, isActive: true } },
    },
  });
}

export async function getFramework(teacherId: string, id: string) {
  await assertFrameworkOwner(teacherId, id);
  return prisma.assessmentFramework.findUniqueOrThrow({
    where: { id },
    include: {
      subject: { select: { id: true, name: true } },
      criteria: { orderBy: [{ dimension: "asc" }, { sortOrder: "asc" }] },
    },
  });
}

/** Tiêu chí đang hoạt động của tất cả khung của giáo viên — dùng cho các form chọn tiêu chí. */
export async function listActiveCriteria(teacherId: string) {
  await ensureDefaultFramework(teacherId);
  return prisma.assessmentCriteria.findMany({
    where: { isActive: true, framework: { ownerId: teacherId } },
    orderBy: [{ framework: { isDefault: "desc" } }, { sortOrder: "asc" }],
    select: { id: true, name: true, dimension: true, framework: { select: { name: true } } },
  });
}

export async function createFramework(teacherId: string, input: z.infer<typeof frameworkCreateSchema>) {
  return prisma.assessmentFramework.create({
    data: {
      ownerId: teacherId,
      name: input.name,
      description: input.description,
      subjectId: input.subjectId,
      criteria: input.fromDefault ? { create: defaultCriteriaData() } : undefined,
    },
  });
}

export async function updateFramework(teacherId: string, id: string, input: z.infer<typeof frameworkUpdateSchema>) {
  await assertFrameworkOwner(teacherId, id);
  return prisma.assessmentFramework.update({ where: { id }, data: input });
}

export async function deleteFramework(teacherId: string, id: string) {
  const fw = await assertFrameworkOwner(teacherId, id);
  const total = await prisma.assessmentFramework.count({ where: { ownerId: teacherId } });
  if (total <= 1) throw new ApiError(409, "Cần giữ lại ít nhất một khung thông tin");
  // Tiêu chí bị xóa -> các mục hồ sơ liên kết chỉ mất liên kết (onDelete: SetNull), không mất dữ liệu
  await prisma.assessmentFramework.delete({ where: { id } });
  return fw;
}

async function assertCriteriaOwner(teacherId: string, criteriaId: string) {
  const c = await prisma.assessmentCriteria.findFirst({ where: { id: criteriaId, framework: { ownerId: teacherId } } });
  if (!c) throw new ApiError(404, "Không tìm thấy tiêu chí");
  return c;
}

export async function addCriteria(teacherId: string, frameworkId: string, input: z.infer<typeof criteriaInputSchema>) {
  await assertFrameworkOwner(teacherId, frameworkId);
  const max = await prisma.assessmentCriteria.aggregate({ where: { frameworkId, dimension: input.dimension }, _max: { sortOrder: true } });
  return prisma.assessmentCriteria.create({
    data: { ...input, frameworkId, sortOrder: (max._max.sortOrder ?? -1) + 1 },
  });
}

export async function updateCriteria(teacherId: string, id: string, input: z.infer<typeof criteriaUpdateSchema>) {
  await assertCriteriaOwner(teacherId, id);
  return prisma.assessmentCriteria.update({ where: { id }, data: input });
}

export async function deleteCriteria(teacherId: string, id: string) {
  const c = await assertCriteriaOwner(teacherId, id);
  await prisma.assessmentCriteria.delete({ where: { id } });
  return c;
}
