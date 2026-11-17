/**
 * Khớp tên/mã học sinh xuất hiện trong nội dung tài liệu (so khớp chuỗi xác định, KHÔNG phải AI).
 * Kết quả chỉ là GỢI Ý — giáo viên quyết định có gắn minh chứng với học sinh hay không.
 */
export type StudentRef = { id: string; fullName: string; studentCode: string | null };
export type StudentMatch = { studentId: string; reason: "full_name" | "student_code"; excerpt: string };

const fold = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/\s+/g, " ");

function excerptAround(text: string, index: number, len: number) {
  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + len + 60);
  return (start > 0 ? "…" : "") + text.slice(start, end).replace(/\s+/g, " ").trim() + (end < text.length ? "…" : "");
}

export function matchStudents(text: string, students: StudentRef[]): StudentMatch[] {
  if (!text) return [];
  // Giữ nguyên độ dài chuỗi khi bỏ dấu để vị trí trích đoạn vẫn đúng
  const source = text.normalize("NFC").replace(/\s/g, " ");
  const folded = fold(source);
  const out: StudentMatch[] = [];
  for (const s of students) {
    const name = fold(s.fullName.trim().replace(/\s+/g, " "));
    // Chỉ khớp họ tên đầy đủ (>= 2 từ) với ranh giới từ để tránh khớp nhầm
    if (name.split(" ").length >= 2) {
      const re = new RegExp(`(^|[^a-z0-9])${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=$|[^a-z0-9])`);
      const m = re.exec(folded);
      if (m) {
        const idx = m.index + m[1].length;
        out.push({ studentId: s.id, reason: "full_name", excerpt: excerptAround(source, idx, name.length) });
        continue;
      }
    }
    if (s.studentCode && s.studentCode.length >= 3) {
      const code = fold(s.studentCode);
      const re = new RegExp(`(^|[^a-z0-9])${code.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&")}(?=$|[^a-z0-9])`);
      const m = re.exec(folded);
      if (m) out.push({ studentId: s.id, reason: "student_code", excerpt: excerptAround(source, m.index + m[1].length, code.length) });
    }
  }
  return out;
}
