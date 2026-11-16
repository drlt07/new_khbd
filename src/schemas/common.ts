import { z } from "zod";

export const optionalText = (max = 2000) =>
  z.string().trim().max(max).optional().nullable().transform((v) => (v ? v : null));

export const SCHOOL_YEAR_REGEX = /^\d{4}-\d{4}$/;
export const schoolYear = z
  .string()
  .trim()
  .regex(SCHOOL_YEAR_REGEX, "Năm học có dạng 2026-2027")
  .refine((v) => Number(v.slice(5)) === Number(v.slice(0, 4)) + 1, "Năm sau phải lớn hơn năm trước 1 năm");

/** Ngày dạng YYYY-MM-DD (input type=date) hoặc rỗng */
export const optionalDate = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v, ctx) => {
    if (!v) return null;
    const d = new Date(`${v}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ngày không hợp lệ" });
      return z.NEVER;
    }
    return d;
  });

const emptyToNull = (v: unknown) => (v === "" ? null : v);

/** Khóa ngoại tùy chọn: chuỗi rỗng từ form (select "— Không chọn —") -> null. */
export const optionalId = z.preprocess(emptyToNull, z.string().min(1).nullable().optional());

/** Số nguyên tùy chọn từ form: "" -> null */
export const optionalInt = (min: number, max: number) =>
  z.preprocess(emptyToNull, z.coerce.number().int().min(min).max(max).nullable().optional());
