import { z } from "zod";

const text = (max = 4000) => z.string().trim().max(max).nullable().optional().transform((v) => (v ? v : null));

export const PHASES = ["OPENING", "KNOWLEDGE", "PRACTICE", "APPLICATION"] as const;

export const lessonCreateSchema = z.object({
  groupingId: z.string().min(1, "Chọn bộ nhóm từ Pha 1"),
  subject: z.string().trim().min(1, "Nhập môn học").max(60),
  title: z.string().trim().min(2, "Nhập tên bài học").max(200),
  periods: z.coerce.number().int().min(1, "Ít nhất 1 tiết").max(10, "Tối đa 10 tiết"),
  requirements: text(),
  knowledgeGoals: text(),
  competencyGoals: text(),
  qualityGoals: text(),
  materials: text(),
});

export const lessonSaveSchema = lessonCreateSchema.omit({ groupingId: true }).extend({
  assessment: text(),
  status: z.enum(["DRAFT", "DONE"]).default("DRAFT"),
  activities: z
    .array(
      z.object({
        phase: z.enum(PHASES),
        title: z.string().trim().min(1, "Tên hoạt động không được trống").max(200),
        minutes: z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().int().min(1).max(500).nullable()),
        goal: text(), content: text(), product: text(), organization: text(6000),
        byGroup: z.boolean(),
        tasks: z.array(z.object({ groupId: z.string(), task: z.string().trim().max(3000), product: text(1000), support: text(1000) })).max(12),
      }),
    )
    .min(1)
    .max(12),
});

export type LessonCreate = z.infer<typeof lessonCreateSchema>;
export type LessonSave = z.infer<typeof lessonSaveSchema>;
