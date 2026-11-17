import { z } from "zod";
import { EvidenceType, ProcessingStatus } from "@prisma/client";
import { optionalDate, optionalId, optionalText } from "./common";

const idList = z.array(z.string().min(1)).max(200).default([]);

/** Thông tin phân loại chung khi tải tệp hoặc nhập văn bản */
export const evidenceMetaSchema = z.object({
  classId: z.string().min(1, "Chọn lớp"),
  subjectId: optionalId,
  type: z.nativeEnum(EvidenceType, { message: "Chọn loại minh chứng" }),
  studentIds: idList,
  criteriaIds: idList,
  title: optionalText(200),
  description: optionalText(2000),
  collectedAt: optionalDate,
});

export const evidenceNoteSchema = evidenceMetaSchema.extend({
  title: z.string().trim().min(2, "Nhập tiêu đề").max(200),
  textContent: z.string().trim().min(5, "Nội dung tối thiểu 5 ký tự").max(20000),
});

export const evidenceUpdateSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  description: optionalText(2000),
  type: z.nativeEnum(EvidenceType).optional(),
  subjectId: optionalId,
  collectedAt: optionalDate,
  studentIds: z.array(z.string().min(1)).max(200).optional(),
  criteriaIds: z.array(z.string().min(1)).max(200).optional(),
  /** chỉ với minh chứng dạng văn bản */
  textContent: z.string().trim().max(20000).optional(),
});

export const evidenceFilterSchema = z.object({
  q: z.string().trim().optional(),
  classId: z.string().trim().optional(),
  studentId: z.string().trim().optional(),
  type: z.preprocess((v) => (v === "" ? undefined : v), z.nativeEnum(EvidenceType).optional()),
  status: z.preprocess((v) => (v === "" ? undefined : v), z.nativeEnum(ProcessingStatus).optional()),
  page: z.coerce.number().int().min(1).default(1),
});

export type EvidenceMeta = z.infer<typeof evidenceMetaSchema>;
export type EvidenceFilter = z.infer<typeof evidenceFilterSchema>;
