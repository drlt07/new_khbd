import type { GroupSpec } from "./match";

export type GroupDraft = GroupSpec & { profile: string };

/** Bộ đặc trưng nhóm mẫu để GV bắt đầu nhanh — có thể sửa toàn bộ. */
export const GROUP_PRESETS: { id: string; label: string; description: string; groups: GroupDraft[] }[] = [
  {
    id: "ngu-van",
    label: "Thiên hướng Ngữ văn",
    description: "Cảm thụ – sáng tạo, phân tích – lập luận, trình bày – truyền thông, và nhóm củng cố nền tảng.",
    groups: [
      { name: "Cảm thụ – Sáng tạo", profile: "Nhạy cảm với hình ảnh, cảm xúc; thích viết, tưởng tượng, sáng tác, nhập vai.", keywords: ["Viết sáng tạo", "Sáng tác", "Tưởng tượng", "Văn học", "Sân khấu", "Diễn xuất", "Hội họa", "Âm nhạc"], scoreMin: null, scoreMax: null, forSupport: false },
      { name: "Phân tích – Lập luận", profile: "Mạnh về đọc hiểu, phân tích, so sánh, lập luận có cấu trúc.", keywords: ["Phân tích", "Đọc hiểu", "Tư duy logic", "Lập luận", "Tranh biện", "Khoa học"], scoreMin: null, scoreMax: null, forSupport: false },
      { name: "Trình bày – Truyền thông", profile: "Tự tin giao tiếp, thuyết trình, làm video, tổ chức hoạt động.", keywords: ["Thuyết trình", "Làm video", "Tổ chức nhóm", "Giao tiếp", "Hoạt động xã hội", "Hợp tác"], scoreMin: null, scoreMax: null, forSupport: false },
      { name: "Củng cố nền tảng", profile: "Cần hướng dẫn từng bước, thêm thời gian và học liệu gợi ý để đạt yêu cầu cần đạt.", keywords: [], scoreMin: null, scoreMax: 6.5, forSupport: true },
    ],
  },
  {
    id: "du-an",
    label: "Vai trò trong dự án",
    description: "Mỗi nhóm đảm nhận một mảng của sản phẩm: nội dung, thiết kế, kỹ thuật, truyền thông.",
    groups: [
      { name: "Nội dung", profile: "Xây dựng ý tưởng, kịch bản, lời dẫn cho sản phẩm.", keywords: ["Viết sáng tạo", "Văn học", "Đọc hiểu", "Phân tích"], scoreMin: null, scoreMax: null, forSupport: false },
      { name: "Thiết kế", profile: "Thiết kế hình ảnh, poster, infographic, bố cục sản phẩm.", keywords: ["Vẽ", "Thiết kế", "Thiết kế đồ họa", "Hội họa", "Tưởng tượng"], scoreMin: null, scoreMax: null, forSupport: false },
      { name: "Kỹ thuật", profile: "Lập trình, dựng video, xử lý kỹ thuật và kiểm thử sản phẩm.", keywords: ["Lập trình", "Tư duy logic", "Làm video", "Khoa học", "Giải quyết vấn đề"], scoreMin: null, scoreMax: null, forSupport: false },
      { name: "Truyền thông", profile: "Thuyết trình, giới thiệu sản phẩm, điều phối nhóm.", keywords: ["Thuyết trình", "Tổ chức nhóm", "Diễn xuất", "Hoạt động xã hội", "Giao tiếp"], scoreMin: null, scoreMax: null, forSupport: false },
    ],
  },
  {
    id: "muc-diem",
    label: "Theo mức đáp ứng (bảng điểm)",
    description: "Ba nhóm theo khoảng điểm môn — cùng yêu cầu cần đạt, khác mức hỗ trợ và độ mở của nhiệm vụ.",
    groups: [
      { name: "Củng cố", profile: "Cần ôn kiến thức nền, phiếu có gợi ý từng bước và ví dụ mẫu.", keywords: [], scoreMin: null, scoreMax: 6.5, forSupport: true },
      { name: "Phát triển", profile: "Nắm được kiến thức cơ bản, cần luyện vận dụng có định hướng.", keywords: [], scoreMin: 6.5, scoreMax: 8, forSupport: false },
      { name: "Mở rộng", profile: "Đáp ứng tốt yêu cầu, sẵn sàng nhiệm vụ mở, sáng tạo, phản biện.", keywords: [], scoreMin: 8, scoreMax: null, forSupport: false },
    ],
  },
];

export const emptyGroup = (i: number): GroupDraft => ({ name: `Nhóm ${i + 1}`, profile: "", keywords: [], scoreMin: null, scoreMax: null, forSupport: false });
