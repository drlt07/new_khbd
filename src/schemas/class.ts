import { z } from "zod";
import { optionalText, schoolYear, optionalInt } from "./common";

export const classInputSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên lớp").max(50),
  schoolYear,
  gradeLevel: optionalInt(1, 12),
  description: optionalText(500),
  /** Danh sách tên môn học; môn chưa có sẽ được tạo mới */
  subjects: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
});
export const classUpdateSchema = classInputSchema.partial().extend({ isArchived: z.boolean().optional() });

export const classFilterSchema = z.object({
  q: z.string().trim().optional(),
  year: z.string().trim().optional(),
  subjectId: z.string().trim().optional(),
  archived: z.enum(["0", "1"]).optional(),
});

export type ClassInput = z.infer<typeof classInputSchema>;
export type ClassUpdate = z.infer<typeof classUpdateSchema>;
export type ClassFilter = z.infer<typeof classFilterSchema>;
