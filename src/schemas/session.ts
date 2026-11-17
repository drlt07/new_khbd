import { z } from "zod";

const score = z.preprocess((v) => (v === "" || v === undefined ? null : v), z.coerce.number().min(0).max(10).nullable());

export const sessionCreateSchema = z.object({
  classId: z.string().min(1, "Chọn lớp"),
  title: z.string().trim().min(2, "Nhập tên phiên phân nhóm").max(200),
  subject: z.string().trim().max(60).nullable().optional(),
});

export const sessionDataSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  subject: z.string().trim().max(60).nullable().optional(),
  scoreSheetId: z.string().nullable().optional(),
});

export const groupCriteriaSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(1, "Tên nhóm không được trống").max(60),
    description: z.string().trim().max(600).nullable().optional(),
    keywords: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
    scoreMin: score.optional().default(null),
    scoreMax: score.optional().default(null),
    forSupport: z.boolean().default(false),
    maxSize: z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().int().min(1).max(60).nullable()).optional().default(null),
  })
  .refine((g) => g.scoreMin == null || g.scoreMax == null || g.scoreMin < g.scoreMax, { message: "Điểm “từ” phải nhỏ hơn điểm “đến”", path: ["scoreMax"] });

export const criteriaSaveSchema = z.object({
  balanceSizes: z.boolean().default(false),
  groups: z.array(groupCriteriaSchema).min(2, "Cần ít nhất 2 nhóm").max(12, "Tối đa 12 nhóm"),
});

export const reviewSaveSchema = z.object({
  groups: z.array(z.object({
    id: z.string(),
    name: z.string().trim().min(1).max(60),
    competency: z.string().max(1000).nullable().optional(),
    strengths: z.array(z.string().max(120)).max(12).default([]),
    difficulties: z.array(z.string().max(120)).max(12).default([]),
    needs: z.string().max(1000).nullable().optional(),
    supportGoal: z.string().max(1000).nullable().optional(),
    members: z.array(z.object({ studentId: z.string(), reason: z.string().max(400).nullable().optional(), fit: z.string().max(20).nullable().optional() })).max(200),
  })).min(1).max(12),
});

export type CriteriaSave = z.infer<typeof criteriaSaveSchema>;
export type ReviewSave = z.infer<typeof reviewSaveSchema>;
