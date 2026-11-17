import { z } from "zod";

export const RESOURCE_TYPES = ["Phiếu học tập", "Bài đọc", "Video", "Trình chiếu", "Đề kiểm tra", "Khác"] as const;
export const resourceSchema = z.object({
  title: z.string().trim().min(2, "Nhập tên học liệu").max(200),
  type: z.enum(RESOURCE_TYPES),
  subject: z.string().trim().max(60).nullable().optional().transform((v) => v || null),
  url: z.string().trim().max(500).nullable().optional().transform((v) => v || null).refine((v) => !v || /^https?:\/\//.test(v), "Đường dẫn phải bắt đầu bằng http:// hoặc https://"),
  description: z.string().trim().max(5000).nullable().optional().transform((v) => v || null),
  tags: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
});
