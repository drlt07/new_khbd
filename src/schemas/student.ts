import { z } from "zod";
import { optionalText } from "./common";

export const GENDERS = ["Nam", "Nữ", "Khác"] as const;
export const TRAIT_KINDS = ["INTEREST", "STRENGTH", "NEED"] as const;

const traitList = z.array(z.string().trim().min(1).max(60)).max(15).default([]);

export const studentInputSchema = z.object({
  fullName: z.string().trim().min(2, "Họ tên tối thiểu 2 ký tự").max(100),
  studentCode: optionalText(30),
  gender: z.preprocess((v) => (v === "" ? null : v), z.enum(GENDERS, { message: "Giới tính phải là Nam, Nữ hoặc Khác" }).nullable().optional()),
  notes: optionalText(500),
  interests: traitList,
  strengths: traitList,
  needs: traitList,
});
export const studentUpdateSchema = studentInputSchema.partial();

/** Một dòng đã chuẩn hóa từ file Excel (bước xác nhận import) */
export const importRowSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  studentCode: z.string().trim().max(30).nullable(),
  gender: z.enum(GENDERS).nullable(),
  notes: z.string().max(500).nullable(),
  interests: z.array(z.string().max(60)).max(15),
  strengths: z.array(z.string().max(60)).max(15),
  needs: z.array(z.string().max(60)).max(15),
});
export const importCommitSchema = z.object({ rows: z.array(importRowSchema).min(1).max(500) });

export type StudentInput = z.infer<typeof studentInputSchema>;
export type StudentUpdate = z.infer<typeof studentUpdateSchema>;
export type ImportRow = z.infer<typeof importRowSchema>;
