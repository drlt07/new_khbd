import { z } from "zod";
import { ProfileDimension } from "@prisma/client";
import { optionalText, optionalId } from "./common";

export const frameworkCreateSchema = z.object({
  name: z.string().trim().min(2, "Tên khung tối thiểu 2 ký tự").max(150),
  description: optionalText(1000),
  subjectId: optionalId,
  /** Sao chép tiêu chí từ khung mặc định của hệ thống */
  fromDefault: z.boolean().default(true),
});
export const frameworkUpdateSchema = frameworkCreateSchema.omit({ fromDefault: true }).partial();

export const criteriaInputSchema = z.object({
  dimension: z.nativeEnum(ProfileDimension),
  name: z.string().trim().min(2, "Tên tiêu chí tối thiểu 2 ký tự").max(150),
  description: optionalText(500),
});
export const criteriaUpdateSchema = criteriaInputSchema
  .omit({ dimension: true })
  .partial()
  .extend({ isActive: z.boolean().optional(), sortOrder: z.number().int().optional() });
