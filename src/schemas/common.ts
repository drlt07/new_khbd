import { z } from "zod";

export const optionalText = (max = 2000) =>
  z.string().trim().max(max).optional().nullable().transform((v) => (v ? v : null));

export const schoolYear = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{4}$/, "Năm học có dạng 2026-2027")
  .refine((v) => Number(v.slice(5)) === Number(v.slice(0, 4)) + 1, "Năm sau phải lớn hơn năm trước 1 năm");
