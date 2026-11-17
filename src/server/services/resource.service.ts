import "server-only";
import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import type { resourceSchema } from "@/schemas/resource";

type Input = z.infer<typeof resourceSchema>;
export const listResources = (userId: string, q?: string) =>
  prisma.learningResource.findMany({
    where: { ownerId: userId, ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { subject: { contains: q, mode: "insensitive" } }, { tags: { has: q } }] } : {}) },
    orderBy: { updatedAt: "desc" },
  });
async function own(userId: string, id: string) {
  if (!(await prisma.learningResource.count({ where: { id, ownerId: userId } }))) throw new ApiError(404, "Không tìm thấy học liệu");
}
export const createResource = (userId: string, input: Input) => prisma.learningResource.create({ data: { ...input, ownerId: userId } });
export async function updateResource(userId: string, id: string, input: Input) { await own(userId, id); return prisma.learningResource.update({ where: { id }, data: input }); }
export async function deleteResource(userId: string, id: string) { await own(userId, id); await prisma.learningResource.delete({ where: { id } }); }
