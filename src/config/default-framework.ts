import type { ProfileDimension } from "@prisma/client";

/** Khung thông tin mặc định A–F (Phần 3 – Bước 2). Giáo viên có thể tùy chỉnh sau khi sao chép. */
export const DEFAULT_CRITERIA: Record<ProfileDimension, string[]> = {
  INTEREST: ["Lĩnh vực yêu thích", "Chủ đề quan tâm", "Hoạt động học tập yêu thích", "Lĩnh vực muốn khám phá"],
  STRENGTH: ["Ngôn ngữ và diễn đạt", "Tư duy logic", "Tư duy sáng tạo", "Khả năng quan sát", "Giao tiếp và hợp tác", "Thiết kế và nghệ thuật", "Giải quyết vấn đề", "Tổ chức và lãnh đạo"],
  COMPETENCY: ["Kiến thức và kỹ năng đã hình thành", "Vận dụng kiến thức", "Giải quyết vấn đề", "Tự học", "Hợp tác", "Sáng tạo"],
  LEARNING_NEED: ["Kiến thức nền tảng", "Thực hiện nhiệm vụ", "Giao tiếp và hợp tác", "Cần hướng dẫn từng bước", "Cần thêm thời gian", "Cần học liệu bổ trợ"],
  LEARNING_PREFERENCE: ["Học qua thực hành", "Học qua dự án", "Học qua thảo luận", "Học qua hình ảnh", "Học qua tình huống", "Học qua trải nghiệm"],
  DEVELOPMENT_GOAL: ["Lĩnh vực muốn phát triển", "Kỹ năng muốn cải thiện", "Hoạt động muốn thử sức", "Mục tiêu tương lai"],
};

export const DIMENSION_ORDER: ProfileDimension[] = [
  "INTEREST", "STRENGTH", "COMPETENCY", "LEARNING_NEED", "LEARNING_PREFERENCE", "DEVELOPMENT_GOAL",
];
