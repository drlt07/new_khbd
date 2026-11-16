// Nhãn tiếng Việt cho các enum — dùng thống nhất trên toàn UI.
import type { LessonPlanStatus, ProfileDimension, ProfileStatus, ReviewStatus } from "@prisma/client";

export const PROFILE_STATUS_LABEL: Record<ProfileStatus, string> = {
  NOT_ANALYZED: "Chưa phân tích",
  ANALYZING: "Đang phân tích",
  PENDING_REVIEW: "Chờ giáo viên xác nhận",
  CONFIRMED: "Đã xác nhận",
  NEEDS_MORE_DATA: "Cần bổ sung dữ liệu",
};

export const PROFILE_STATUS_TONE: Record<ProfileStatus, "neutral" | "info" | "warning" | "success" | "danger"> = {
  NOT_ANALYZED: "neutral",
  ANALYZING: "info",
  PENDING_REVIEW: "warning",
  CONFIRMED: "success",
  NEEDS_MORE_DATA: "danger",
};

export const LESSON_STATUS_LABEL: Record<LessonPlanStatus, string> = {
  DRAFT: "Bản nháp",
  GENERATED: "Đã tạo nội dung",
  CONFIRMED: "Đã xác nhận",
  ARCHIVED: "Lưu trữ",
};

export const LESSON_STATUS_TONE: Record<LessonPlanStatus, "neutral" | "info" | "warning" | "success" | "danger"> = {
  DRAFT: "neutral",
  GENERATED: "info",
  CONFIRMED: "success",
  ARCHIVED: "neutral",
};

export const DIMENSION_LABEL: Record<ProfileDimension, string> = {
  INTEREST: "Sở thích và hứng thú",
  STRENGTH: "Thế mạnh và năng khiếu",
  COMPETENCY: "Năng lực học tập",
  LEARNING_NEED: "Khó khăn và nhu cầu hỗ trợ",
  LEARNING_PREFERENCE: "Cách thức học tập phù hợp",
  DEVELOPMENT_GOAL: "Định hướng phát triển",
};

export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  EDITED: "Đã chỉnh sửa",
  REJECTED: "Đã từ chối",
  NEEDS_DATA: "Chưa đủ căn cứ",
};
