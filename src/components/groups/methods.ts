export const METHOD_INFO = {
  MIXED: { label: "Đa dạng thế mạnh", desc: "Mỗi nhóm có nhiều thế mạnh khác nhau; học sinh cần hỗ trợ được rải đều và xếp cùng bạn có thế mạnh." },
  INTEREST: { label: "Theo sở thích", desc: "Học sinh cùng sở thích vào chung nhóm (mỗi nhóm một chủ đề). Bạn không trùng chủ đề được thử sức lĩnh vực mới." },
  RANDOM: { label: "Ngẫu nhiên", desc: "Chia ngẫu nhiên, sĩ số các nhóm cân bằng." },
} as const;
export type Method = keyof typeof METHOD_INFO;
