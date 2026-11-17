import { z } from "zod";

/** Gửi kèm tệp khi xác nhận nhập bảng điểm (multipart field "options") */
export const scoreCommitSchema = z.object({
  subject: z.string().trim().min(1, "Nhập môn học của bảng điểm").max(60),
  columns: z.array(z.object({ index: z.number().int().min(0), label: z.string().trim().min(1).max(120), weight: z.number().int().min(1).max(5) })).min(1, "Chọn ít nhất 1 cột điểm").max(40),
  createMissing: z.boolean().default(false),
});
export type ScoreCommit = z.infer<typeof scoreCommitSchema>;
