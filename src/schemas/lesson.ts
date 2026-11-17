import { z } from "zod";

const text = (max = 4000) => z.string().trim().max(max).nullable().optional().transform((v) => (v ? v : null));
export const PHASES = ["OPENING", "KNOWLEDGE", "PRACTICE", "APPLICATION"] as const;

const info = {
  subject: z.string().trim().min(1, "Nhập môn học").max(60),
  title: z.string().trim().min(2, "Nhập tên bài học").max(200),
  periods: z.coerce.number().int().min(1, "Ít nhất 1 tiết").max(10, "Tối đa 10 tiết"),
  requirements: text(),
  content: text(),
  methods: text(1000),
};

export const lessonCreateSchema = z.object({ sessionId: z.string().min(1, "Chọn hồ sơ nhóm đã duyệt"), ...info });

const task = z.object({
  groupId: z.string(), task: z.string().trim().max(3000), product: text(1000), support: text(1000),
  materials: text(3000), challenge: text(300), assessment: text(1000),
});

export const lessonSaveSchema = z.object({
  ...info,
  knowledgeGoals: text(), competencyGoals: text(), qualityGoals: text(), materials: text(), assessment: text(),
  status: z.enum(["DRAFT", "REVIEW", "DONE"]).default("DRAFT"),
  activities: z.array(z.object({
    phase: z.enum(PHASES),
    title: z.string().trim().min(1, "Tên hoạt động không được trống").max(200),
    minutes: z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().int().min(1).max(500).nullable()),
    goal: text(), content: text(), product: text(), organization: text(6000),
    byGroup: z.boolean(),
    tasks: z.array(task).max(12),
  })).max(12),
});

export const assistSchema = z.object({
  action: z.enum(["suggest", "easier", "harder", "material"]),
  lesson: z.object(info),
  phase: z.enum(PHASES),
  activityTitle: z.string().max(200),
  groupId: z.string().optional(),
  task: task.optional(),
});

export type LessonCreate = z.infer<typeof lessonCreateSchema>;
export type LessonSave = z.infer<typeof lessonSaveSchema>;
export type AssistInput = z.infer<typeof assistSchema>;
