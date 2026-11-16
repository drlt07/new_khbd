import { z } from "zod";
import { ProfileDimension, ProfileStatus } from "@prisma/client";
import { optionalDate, optionalText, optionalId } from "./common";

/** Mục hồ sơ do giáo viên nhập trực tiếp (origin = TEACHER, đã xác thực). */
export const profileItemSchema = z.object({
  dimension: z.nativeEnum(ProfileDimension),
  title: z.string().trim().min(2, "Vui lòng nhập nội dung (tối thiểu 2 ký tự)").max(300),
  description: optionalText(2000),
  criteriaId: optionalId,
  supportStrategy: optionalText(1000), // chỉ dùng cho LEARNING_NEED
  subjectId: optionalId, // COMPETENCY
});
export const profileItemUpdateSchema = profileItemSchema.omit({ dimension: true }).partial();

export const observationSchema = z.object({
  content: z.string().trim().min(3, "Nhận xét tối thiểu 3 ký tự").max(5000),
  context: optionalText(300),
  subjectId: optionalId,
  observedAt: optionalDate,
});

export const academicResultSchema = z
  .object({
    subjectId: z.string().min(1, "Chọn môn học"),
    assessmentName: z.string().trim().min(2, "Nhập tên bài đánh giá").max(150),
    term: optionalText(50),
    score: z.coerce.number().min(0).max(1000).optional().nullable(),
    maxScore: z.coerce.number().positive().max(1000).optional().nullable(),
    requirementRef: optionalText(500),
    comment: optionalText(1000),
  })
  .refine((v) => v.score == null || v.maxScore == null || v.score <= v.maxScore, {
    path: ["score"],
    message: "Điểm không được lớn hơn thang điểm",
  });

export const profileMetaSchema = z.object({
  summary: optionalText(3000),
  teacherComment: optionalText(3000),
  profileStatus: z.nativeEnum(ProfileStatus).optional(),
});
