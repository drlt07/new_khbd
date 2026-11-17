import { z } from "zod";

export const GROUPING_METHODS = ["MIXED", "INTEREST", "RANDOM"] as const;

export const groupingCreateSchema = z.object({
  classId: z.string().min(1, "Chọn lớp"),
  title: z.string().trim().min(2, "Nhập tên bài học / hoạt động").max(200),
  method: z.enum(GROUPING_METHODS),
  groupCount: z.coerce.number().int().min(2, "Ít nhất 2 nhóm").max(20, "Tối đa 20 nhóm"),
  /** Bỏ qua học sinh vắng */
  excludeStudentIds: z.array(z.string()).max(200).default([]),
});

/** Lưu toàn bộ kết quả sau khi giáo viên chỉnh sửa */
export const groupingSaveSchema = z.object({
  title: z.string().trim().min(2).max(200),
  method: z.enum(GROUPING_METHODS).optional(),
  groups: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Tên nhóm không được trống").max(60),
        task: z.string().trim().max(500).nullable().optional(),
        members: z.array(z.object({ studentId: z.string(), reason: z.string().max(300).nullable().optional() })).max(200),
      }),
    )
    .min(1)
    .max(20),
});
