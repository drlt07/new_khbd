import "server-only";
import type { Prisma, TraitKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import type { ImportRow, StudentInput, StudentUpdate } from "@/schemas/student";
import { assertClassOwner, assertStudentOwner } from "./authz";

const studentInclude = { traits: { orderBy: { createdAt: "asc" } }, class: { select: { id: true, name: true } } } as const;

export type StudentWithTraits = Prisma.StudentGetPayload<{ include: typeof studentInclude }>;

/** Chuyển danh sách đặc điểm thành 3 mảng để hiển thị / gửi về client */
export function splitTraits(traits: { kind: TraitKind; label: string }[]) {
  return {
    interests: traits.filter((t) => t.kind === "INTEREST").map((t) => t.label),
    strengths: traits.filter((t) => t.kind === "STRENGTH").map((t) => t.label),
    needs: traits.filter((t) => t.kind === "NEED").map((t) => t.label),
  };
}

function traitRows(input: { interests?: string[]; strengths?: string[]; needs?: string[] }) {
  const uniq = (xs: string[] = []) => [...new Map(xs.map((x) => [x.trim().toLowerCase(), x.trim()])).values()].filter(Boolean);
  return [
    ...uniq(input.interests).map((label) => ({ kind: "INTEREST" as const, label })),
    ...uniq(input.strengths).map((label) => ({ kind: "STRENGTH" as const, label })),
    ...uniq(input.needs).map((label) => ({ kind: "NEED" as const, label })),
  ];
}

export async function listStudents(userId: string, filter: { classId?: string; q?: string } = {}) {
  return prisma.student.findMany({
    where: {
      class: { ownerId: userId },
      ...(filter.classId ? { classId: filter.classId } : {}),
      ...(filter.q
        ? { OR: [{ fullName: { contains: filter.q, mode: "insensitive" } }, { studentCode: { contains: filter.q, mode: "insensitive" } }] }
        : {}),
    },
    orderBy: [{ class: { name: "asc" } }, { fullName: "asc" }],
    include: studentInclude,
  });
}

async function ensureUniqueCode(classId: string, code: string | null | undefined, excludeId?: string) {
  if (!code) return;
  const dup = await prisma.student.findFirst({ where: { classId, studentCode: code, NOT: excludeId ? { id: excludeId } : undefined } });
  if (dup) throw new ApiError(409, "Mã học sinh đã tồn tại trong lớp", { studentCode: ["Mã học sinh đã tồn tại trong lớp"] });
}

export async function createStudent(userId: string, classId: string, input: StudentInput) {
  await assertClassOwner(userId, classId);
  await ensureUniqueCode(classId, input.studentCode);
  const { interests, strengths, needs, ...data } = input;
  return prisma.student.create({
    data: { ...data, gender: data.gender ?? null, classId, traits: { create: traitRows({ interests, strengths, needs }) } },
  });
}

export async function updateStudent(userId: string, id: string, input: StudentUpdate) {
  const s = await assertStudentOwner(userId, id);
  if (input.studentCode !== undefined) await ensureUniqueCode(s.classId, input.studentCode, id);
  const { interests, strengths, needs, ...data } = input;
  return prisma.$transaction(async (tx) => {
    // Chỉ thay nhóm đặc điểm nào được gửi lên
    const kinds: TraitKind[] = [];
    if (interests) kinds.push("INTEREST");
    if (strengths) kinds.push("STRENGTH");
    if (needs) kinds.push("NEED");
    if (kinds.length) {
      await tx.studentTrait.deleteMany({ where: { studentId: id, kind: { in: kinds } } });
      await tx.studentTrait.createMany({ data: traitRows({ interests, strengths, needs }).map((t) => ({ ...t, studentId: id })) });
    }
    return tx.student.update({ where: { id }, data });
  });
}

export async function deleteStudent(userId: string, id: string) {
  await assertStudentOwner(userId, id);
  await prisma.student.delete({ where: { id } });
}

/** Ghi các dòng đã xem trước. Bỏ qua mã trùng (không ghi đè). */
export async function importStudents(userId: string, classId: string, rows: ImportRow[]) {
  await assertClassOwner(userId, classId);
  const existing = new Set(
    (await prisma.student.findMany({ where: { classId, studentCode: { not: null } }, select: { studentCode: true } })).map((s) => s.studentCode!),
  );
  const seen = new Set<string>();
  const toCreate = rows.filter((r) => {
    if (!r.studentCode) return true;
    if (existing.has(r.studentCode) || seen.has(r.studentCode)) return false;
    seen.add(r.studentCode);
    return true;
  });
  await prisma.$transaction(
    toCreate.map((r) =>
      prisma.student.create({
        data: {
          classId, fullName: r.fullName, studentCode: r.studentCode, gender: r.gender, notes: r.notes,
          traits: { create: traitRows(r) },
        },
      }),
    ),
  );
  return { created: toCreate.length, skipped: rows.length - toCreate.length };
}
