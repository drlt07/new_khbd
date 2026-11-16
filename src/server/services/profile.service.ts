import "server-only";
import type { z } from "zod";
import type { ProfileDimension } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import type {
  academicResultSchema, observationSchema, profileItemSchema, profileItemUpdateSchema, profileMetaSchema,
} from "@/schemas/profile";
import { assertStudentOwner } from "./authz";

type ItemInput = z.infer<typeof profileItemSchema>;
type ItemUpdate = z.infer<typeof profileItemUpdateSchema>;

/** Giao diện tối thiểu chung cho 6 bảng mục hồ sơ. */
type ItemDelegate = {
  create(args: { data: Record<string, unknown> }): Promise<{ id: string }>;
  update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<{ id: string }>;
  delete(args: { where: { id: string } }): Promise<unknown>;
  findFirst(args: { where: Record<string, unknown> }): Promise<{ id: string; studentId: string; origin: string } | null>;
};

function delegate(dimension: ProfileDimension): ItemDelegate {
  const map = {
    INTEREST: prisma.studentInterest,
    STRENGTH: prisma.studentStrength,
    COMPETENCY: prisma.competencyAssessment,
    LEARNING_NEED: prisma.studentLearningNeed,
    LEARNING_PREFERENCE: prisma.studentLearningPreference,
    DEVELOPMENT_GOAL: prisma.studentDevelopmentGoal,
  } as const;
  return map[dimension] as unknown as ItemDelegate;
}

/** Chuẩn hóa dữ liệu chung -> cột của từng bảng (CompetencyAssessment dùng competencyName/observation). */
function toColumns(dimension: ProfileDimension, input: ItemUpdate) {
  const base: Record<string, unknown> = {};
  if (input.criteriaId !== undefined) base.criteriaId = input.criteriaId;
  if (dimension === "COMPETENCY") {
    if (input.title !== undefined) base.competencyName = input.title;
    if (input.description !== undefined) base.observation = input.description ?? "";
    if (input.subjectId !== undefined) base.subjectId = input.subjectId;
  } else {
    if (input.title !== undefined) base.title = input.title;
    if (input.description !== undefined) base.description = input.description;
    if (dimension === "LEARNING_NEED" && input.supportStrategy !== undefined) base.supportStrategy = input.supportStrategy;
  }
  return base;
}

async function assertCriteriaMatches(teacherId: string, criteriaId: string | null | undefined, dimension: ProfileDimension) {
  if (!criteriaId) return;
  const c = await prisma.assessmentCriteria.findFirst({ where: { id: criteriaId, framework: { ownerId: teacherId } } });
  if (!c) throw new ApiError(404, "Không tìm thấy tiêu chí");
  if (c.dimension !== dimension) throw new ApiError(422, "Tiêu chí không thuộc phương diện đã chọn", { criteriaId: ["Tiêu chí không khớp phương diện"] });
}

export async function getStudentProfile(teacherId: string, studentId: string) {
  await assertStudentOwner(teacherId, studentId);
  const itemInclude = {
    criteria: { select: { id: true, name: true } },
    evidences: { select: { id: true, title: true } },
  } as const;
  const order = { createdAt: "asc" } as const;
  const student = await prisma.student.findUniqueOrThrow({
    where: { id: studentId },
    include: {
      class: { select: { id: true, name: true, schoolYear: true, subjects: { select: { subject: { select: { id: true, name: true } } } } } },
      profile: true,
      interests: { include: itemInclude, orderBy: order },
      strengths: { include: itemInclude, orderBy: order },
      learningNeeds: { include: itemInclude, orderBy: order },
      preferences: { include: itemInclude, orderBy: order },
      developmentGoals: { include: itemInclude, orderBy: order },
      competencies: { include: { ...itemInclude, subject: { select: { id: true, name: true } } }, orderBy: order },
      academicResults: { include: { subject: { select: { name: true } } }, orderBy: { recordedAt: "desc" } },
      observations: { include: { subject: { select: { name: true } } }, orderBy: { observedAt: "desc" } },
      evidenceLinks: {
        include: { evidence: { select: { id: true, title: true, type: true, source: true, collectedAt: true, processingStatus: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  const history = await prisma.auditLog.findMany({
    where: { entityType: "Student", entityId: studentId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { fullName: true } } },
  });
  return { student, history };
}
export type StudentProfileData = Awaited<ReturnType<typeof getStudentProfile>>;

export async function addProfileItem(teacherId: string, studentId: string, input: ItemInput) {
  await assertStudentOwner(teacherId, studentId);
  await assertCriteriaMatches(teacherId, input.criteriaId, input.dimension);
  if (input.dimension === "COMPETENCY" && !input.description)
    throw new ApiError(422, "Vui lòng mô tả biểu hiện năng lực", { description: ["Mô tả biểu hiện cụ thể quan sát được"] });
  const item = await delegate(input.dimension).create({
    // Giáo viên nhập trực tiếp => dữ liệu đã xác thực
    data: { ...toColumns(input.dimension, input), studentId, origin: "TEACHER", reviewStatus: "CONFIRMED" },
  });
  await touchProfile(studentId);
  return item;
}

async function findItem(teacherId: string, dimension: ProfileDimension, id: string) {
  const item = await delegate(dimension).findFirst({ where: { id, student: { class: { ownerId: teacherId } } } });
  if (!item) throw new ApiError(404, "Không tìm thấy mục hồ sơ");
  return item;
}

export async function updateProfileItem(teacherId: string, dimension: ProfileDimension, id: string, input: ItemUpdate) {
  const item = await findItem(teacherId, dimension, id);
  await assertCriteriaMatches(teacherId, input.criteriaId, dimension);
  const updated = await delegate(dimension).update({
    where: { id },
    // Mục do AI đề xuất mà giáo viên sửa => EDITED (đã xác nhận có chỉnh sửa)
    data: { ...toColumns(dimension, input), ...(item.origin === "AI" ? { reviewStatus: "EDITED" } : {}) },
  });
  await touchProfile(item.studentId);
  return { ...updated, studentId: item.studentId };
}

export async function deleteProfileItem(teacherId: string, dimension: ProfileDimension, id: string) {
  const item = await findItem(teacherId, dimension, id);
  await delegate(dimension).delete({ where: { id } });
  await touchProfile(item.studentId);
  return item;
}

async function touchProfile(studentId: string) {
  await prisma.studentCompetencyProfile.upsert({
    where: { studentId },
    update: { version: { increment: 1 } },
    create: { studentId },
  });
}

export async function updateProfileMeta(teacherId: string, studentId: string, input: z.infer<typeof profileMetaSchema>) {
  await assertStudentOwner(teacherId, studentId);
  const { profileStatus, ...meta } = input;
  await prisma.$transaction([
    prisma.studentCompetencyProfile.upsert({
      where: { studentId },
      update: { ...meta, version: { increment: 1 }, ...(profileStatus === "CONFIRMED" ? { lastReviewedAt: new Date() } : {}) },
      create: { studentId, ...meta },
    }),
    ...(profileStatus ? [prisma.student.update({ where: { id: studentId }, data: { profileStatus } })] : []),
  ]);
}

export async function addObservation(teacherId: string, studentId: string, input: z.infer<typeof observationSchema>) {
  await assertStudentOwner(teacherId, studentId);
  return prisma.studentObservation.create({
    data: {
      studentId,
      teacherId,
      content: input.content,
      context: input.context,
      subjectId: input.subjectId,
      observedAt: input.observedAt ?? new Date(),
    },
  });
}

export async function deleteObservation(teacherId: string, id: string) {
  const o = await prisma.studentObservation.findFirst({ where: { id, student: { class: { ownerId: teacherId } } } });
  if (!o) throw new ApiError(404, "Không tìm thấy nhận xét");
  await prisma.studentObservation.delete({ where: { id } });
  return o;
}

export async function addAcademicResult(teacherId: string, studentId: string, input: z.infer<typeof academicResultSchema>) {
  await assertStudentOwner(teacherId, studentId);
  return prisma.academicResult.create({ data: { ...input, studentId } });
}

export async function deleteAcademicResult(teacherId: string, id: string) {
  const r = await prisma.academicResult.findFirst({ where: { id, student: { class: { ownerId: teacherId } } } });
  if (!r) throw new ApiError(404, "Không tìm thấy kết quả học tập");
  await prisma.academicResult.delete({ where: { id } });
  return r;
}
