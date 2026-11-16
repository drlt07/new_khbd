import type { AITaskType } from "@prisma/client";

/**
 * Danh mục 10 tác vụ AI độc lập (Phần 10). Mỗi tác vụ có file định nghĩa riêng trong
 * src/server/ai/tasks/ khi được triển khai ở sprint tương ứng.
 */
export const AI_TASK_CATALOG: Record<AITaskType, { label: string; sprint: number; description: string }> = {
  DOCUMENT_EXTRACTION: { label: "Trích xuất tài liệu", sprint: 4, description: "Trích xuất văn bản/bảng từ PDF, DOCX, XLSX, ảnh." },
  STUDENT_PROFILE_ANALYSIS: { label: "Phân tích hồ sơ học sinh", sprint: 4, description: "Nhận diện sở thích, thế mạnh, năng lực, cách học, định hướng." },
  EVIDENCE_MAPPING: { label: "Liên kết minh chứng", sprint: 4, description: "Gắn từng nhận định với minh chứng và trích đoạn." },
  LEARNING_NEEDS_ANALYSIS: { label: "Phân tích nhu cầu hỗ trợ", sprint: 4, description: "Nhận diện khó khăn và hình thức hỗ trợ phù hợp." },
  LESSON_ANALYSIS: { label: "Phân tích bài học", sprint: 5, description: "Mục tiêu, YCCĐ, trọng tâm, khó khăn dự kiến, cơ hội cá thể hóa." },
  ACTIVITY_RECOMMENDATION: { label: "Đề xuất hoạt động", sprint: 5, description: "Đề xuất hoạt động theo tiến trình 4 bước." },
  FLEXIBLE_GROUPING: { label: "Phân nhóm linh hoạt", sprint: 5, description: "Đề xuất nhóm theo bài học, có căn cứ từ hồ sơ đã xác nhận." },
  DIFFERENTIATED_TASK_GENERATION: { label: "Tạo nhiệm vụ cá thể hóa", sprint: 5, description: "Nhiệm vụ khác nhau hướng tới cùng YCCĐ." },
  LESSON_PLAN_GENERATION: { label: "Tạo KHBD", sprint: 6, description: "Sinh KHBD hoàn chỉnh theo cấu trúc I–V hoặc mẫu của trường." },
  LESSON_PLAN_REVISION: { label: "Chỉnh sửa KHBD", sprint: 6, description: "Viết lại / phát triển chi tiết một hoạt động." },
};
