import { z } from "zod";

const score = z.preprocess((v) => (v === "" || v === undefined ? null : v), z.coerce.number().min(0).max(10).nullable());

export const groupSpecSchema = z
  .object({
    id: z.string().optional(), // nhóm đã có (giữ id để không mất nhiệm vụ KHBD đã soạn)
    name: z.string().trim().min(1, "Tên nhóm không được trống").max(60),
    profile: z.string().trim().max(500).nullable().optional(),
    keywords: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
    scoreMin: score.optional().default(null),
    scoreMax: score.optional().default(null),
    forSupport: z.boolean().default(false),
  })
  .refine((g) => g.scoreMin == null || g.scoreMax == null || g.scoreMin < g.scoreMax, { message: "Điểm “từ” phải nhỏ hơn điểm “đến”", path: ["scoreMax"] });

const settings = {
  title: z.string().trim().min(2, "Nhập tên bộ nhóm").max(200),
  subject: z.string().trim().max(60).nullable().optional(),
  scoreSheetId: z.string().nullable().optional(),
  balanceSizes: z.boolean().default(true),
};

/** Bước tạo: GV đặt số nhóm + đặc trưng, hệ thống xếp học sinh */
export const groupingCreateSchema = z.object({
  classId: z.string().min(1, "Chọn lớp"),
  ...settings,
  groups: z.array(groupSpecSchema).min(2, "Cần ít nhất 2 nhóm").max(12, "Tối đa 12 nhóm"),
  excludeStudentIds: z.array(z.string()).max(200).default([]),
});

/** Xếp lại (không lưu) */
export const groupingAssignSchema = z.object({
  scoreSheetId: z.string().nullable().optional(),
  balanceSizes: z.boolean().default(true),
  groups: z.array(groupSpecSchema).min(1).max(12),
  studentIds: z.array(z.string()).min(1).max(200),
});

/** Lưu toàn bộ sau khi GV chỉnh */
export const groupingSaveSchema = z.object({
  ...settings,
  groups: z
    .array(groupSpecSchema.and(z.object({
      members: z.array(z.object({ studentId: z.string(), reason: z.string().max(400).nullable().optional() })).max(200),
    })))
    .min(1)
    .max(12),
});

export type GroupingCreate = z.infer<typeof groupingCreateSchema>;
export type GroupingSave = z.infer<typeof groupingSaveSchema>;
