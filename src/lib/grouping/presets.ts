export type GroupDraft = {
  name: string;
  description: string;
  keywords: string[];
  scoreMin: number | null;
  scoreMax: number | null;
  forSupport: boolean;
  maxSize: number | null;
};

const g = (name: string, description: string, extra: Partial<GroupDraft> = {}): GroupDraft => ({ name, description, keywords: [], scoreMin: null, scoreMax: null, forSupport: false, maxSize: null, ...extra });

/** Bộ mô tả nhóm mẫu — GV sửa tự do; hệ thống diễn giải mô tả thành tiêu chí */
export const GROUP_PRESETS: { id: string; label: string; description: string; groups: GroupDraft[] }[] = [
  {
    id: "nang-luc", label: "Theo năng lực (4 mức)", description: "Tốt – khá – trung bình – cần củng cố; dùng điểm số kết hợp đặc trưng.",
    groups: [
      g("Nhóm 1 – Nâng cao", "Học sinh có năng lực tốt, khả năng tự học cao."),
      g("Nhóm 2 – Vận dụng", "Học sinh khá, có khả năng vận dụng kiến thức."),
      g("Nhóm 3 – Có hướng dẫn", "Học sinh trung bình, cần hướng dẫn."),
      g("Nhóm 4 – Củng cố", "Học sinh cần hỗ trợ củng cố kiến thức nền."),
    ],
  },
  {
    id: "ngu-van", label: "Thiên hướng Ngữ văn", description: "Cảm thụ – sáng tạo, phân tích – lập luận, trình bày, củng cố nền tảng.",
    groups: [
      g("Cảm thụ – Sáng tạo", "Học sinh thích viết sáng tạo, tưởng tượng, nhập vai; nhạy cảm với hình ảnh, cảm xúc.", { keywords: ["Viết sáng tạo", "Sáng tác", "Tưởng tượng", "Văn học", "Sân khấu", "Hội họa", "Âm nhạc"] }),
      g("Phân tích – Lập luận", "Học sinh mạnh về đọc hiểu, phân tích, lập luận có cấu trúc.", { keywords: ["Phân tích", "Đọc hiểu", "Tư duy logic", "Khoa học"] }),
      g("Trình bày – Truyền thông", "Học sinh tự tin thuyết trình, làm video, tổ chức hoạt động nhóm.", { keywords: ["Thuyết trình", "Làm video", "Tổ chức nhóm", "Hoạt động xã hội", "Hợp tác"] }),
      g("Củng cố nền tảng", "Học sinh cần hỗ trợ củng cố kiến thức nền, hướng dẫn từng bước."),
    ],
  },
  {
    id: "du-an", label: "Vai trò trong dự án", description: "Nội dung, thiết kế, kỹ thuật, truyền thông — mỗi nhóm một mảng sản phẩm.",
    groups: [
      g("Nội dung", "Học sinh viết tốt, đọc hiểu tốt; xây dựng ý tưởng, kịch bản.", { keywords: ["Viết sáng tạo", "Văn học", "Đọc hiểu", "Phân tích"] }),
      g("Thiết kế", "Học sinh có năng khiếu vẽ, thiết kế, thẩm mỹ.", { keywords: ["Vẽ", "Thiết kế", "Thiết kế đồ họa", "Hội họa"] }),
      g("Kỹ thuật", "Học sinh thích lập trình, công nghệ, làm video.", { keywords: ["Lập trình", "Tư duy logic", "Làm video", "Khoa học"] }),
      g("Truyền thông", "Học sinh tự tin thuyết trình, điều phối nhóm.", { keywords: ["Thuyết trình", "Tổ chức nhóm", "Diễn xuất", "Hoạt động xã hội"] }),
    ],
  },
];

export const emptyGroup = (i: number): GroupDraft => g(`Nhóm ${i + 1}`, "");
