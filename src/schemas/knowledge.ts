import { z } from "zod";
import { optionalId, optionalInt, optionalText } from "./common";

export const collectionInputSchema = z.object({
  name: z.string().trim().min(2, "Tên tối thiểu 2 ký tự").max(150),
  description: optionalText(1000),
  subjectId: optionalId,
  gradeLevel: optionalInt(1, 12),
});
export const collectionUpdateSchema = collectionInputSchema.partial();

export const documentUpdateSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  description: optionalText(1000),
  volume: z.preprocess((v) => (v === "" ? null : v), z.string().trim().max(30).nullable().optional()),
});

export const knowledgeSearchSchema = z.object({
  q: z.string().trim().min(2, "Nhập ít nhất 2 ký tự").max(300),
  lesson: z.string().trim().max(60).optional(),
  limit: z.coerce.number().int().min(1).max(30).default(10),
});
