import { z } from "zod";
import { ProfileStatus } from "@prisma/client";
import { optionalDate, optionalText } from "./common";

export const GENDERS = ["Nam", "Nữ", "Khác"] as const;

export const studentInputSchema = z.object({
  fullName: z.string().trim().min(2, "Họ tên tối thiểu 2 ký tự").max(100),
  studentCode: optionalText(30),
  dateOfBirth: optionalDate,
  gender: z.preprocess((v) => (v === "" ? null : v), z.enum(GENDERS, { message: "Giới tính phải là Nam, Nữ hoặc Khác" }).nullable().optional()),
  notes: optionalText(1000),
});
export const studentUpdateSchema = studentInputSchema.partial().extend({
  classId: z.string().optional(), // chuyển lớp
});

export const studentFilterSchema = z.object({
  q: z.string().trim().optional(),
  classId: z.string().trim().optional(),
  status: z.nativeEnum(ProfileStatus).optional().or(z.literal("").transform(() => undefined)),
});

/** Một dòng đã chuẩn hóa từ file Excel (dùng cho bước xác nhận import) */
export const importRowSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  studentCode: z.string().trim().max(30).nullable(),
  dateOfBirth: z.string().nullable(), // ISO yyyy-mm-dd
  gender: z.enum(GENDERS).nullable(),
  notes: z.string().max(1000).nullable(),
});
export const importCommitSchema = z.object({ rows: z.array(importRowSchema).min(1).max(500) });

export type StudentInput = z.infer<typeof studentInputSchema>;
export type StudentUpdate = z.infer<typeof studentUpdateSchema>;
export type ImportRow = z.infer<typeof importRowSchema>;
