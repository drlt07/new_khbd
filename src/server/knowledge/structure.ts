/**
 * Nhận diện cấu trúc tài liệu SGV/SGK theo từng trang (heuristic, không dùng AI):
 *  - Số trang in trên sách (dòng đầu là số)
 *  - Mở đầu bài học: dòng "Bài N" + tiêu đề in hoa; "ÔN TẬP HỌC KÌ I/II"
 *  - Đề mục con: "Văn bản N" + tên văn bản; các phần ĐỌC / VIẾT / NÓI VÀ NGHE / THỰC HÀNH TIẾNG VIỆT...
 * Kết quả có thể chưa hoàn hảo với tài liệu có bố cục khác — giáo viên xem lại trong trang tài liệu.
 */
export type Lesson = { label: string; title: string | null };
export type OutlineItem = { kind: "lesson" | "section"; label: string; title: string | null; pdfPage: number; bookPage: number | null };
export type PageMarker = { pdfPage: number; bookPage: number | null; lines: string[] };

const SECTION_HEADINGS: Record<string, string> = {
  "I YÊU CẦU CẦN ĐẠT": "Yêu cầu cần đạt",
  "II CHUẨN BỊ": "Chuẩn bị",
  "III TỔ CHỨC HOẠT ĐỘNG DẠY HỌC": "Tổ chức hoạt động dạy học",
  "ĐỌC": "Đọc",
  "TÌM HIỂU TRI THỨC NGỮ VĂN": "Tìm hiểu tri thức ngữ văn",
  "THỰC HÀNH TIẾNG VIỆT": "Thực hành tiếng Việt",
  "VIẾT": "Viết",
  "NÓI VÀ NGHE": "Nói và nghe",
  "CỦNG CỐ, MỞ RỘNG": "Củng cố, mở rộng",
  "THỰC HÀNH ĐỌC": "Thực hành đọc",
  "PHẦN MỘT": "Phần một",
  "PHẦN HAI": "Phần hai",
};

const isUpperTitle = (l: string) => l.length >= 2 && l === l.toLocaleUpperCase("vi") && /[A-ZÀ-ỸĐ]/.test(l) && !/^[IVX]+\s/.test(l);

export function toPageMarker(pdfPage: number, raw: string): PageMarker {
  const lines = raw.split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  let bookPage: number | null = null;
  if (lines[0] && /^\d{1,4}$/.test(lines[0])) bookPage = Number(lines.shift());
  return { pdfPage, bookPage, lines };
}

/** Trả về bài học mở đầu ở trang này (nếu có). */
export function detectLessonStart(p: PageMarker): Lesson | null {
  const head = p.lines.slice(0, 4);
  const i = head.findIndex((l) => /^Bài\s*\d{1,2}$/.test(l));
  if (i >= 0) {
    const title: string[] = [];
    for (const l of p.lines.slice(i + 1, i + 5)) {
      if (l.startsWith("(") || /^I\s/.test(l) || !isUpperTitle(l)) break;
      title.push(l);
    }
    return { label: head[i].replace(/\s+/g, " ").replace(/^Bài(\d)/, "Bài $1"), title: title.join(" ").replace(/\s+/g, " ") || null };
  }
  const review = head.find((l) => /^ÔN TẬP HỌC KÌ\s+(I|II)$/.test(l));
  if (review) return { label: review.replace("ÔN TẬP HỌC KÌ", "Ôn tập học kì"), title: null };
  return null;
}

/** Đề mục con xuất hiện trong trang, theo thứ tự, kèm chỉ số dòng. */
export function detectSections(p: PageMarker): { line: number; heading: string }[] {
  const out: { line: number; heading: string }[] = [];
  p.lines.forEach((l, i) => {
    const vb = l.match(/^Văn bản\s*(\d)$/);
    if (vb) {
      const name = p.lines[i + 1] && !/^\d\./.test(p.lines[i + 1]) ? p.lines[i + 1] : "";
      out.push({ line: i, heading: `Văn bản ${vb[1]}${name ? `: ${name}` : ""}` });
      return;
    }
    // Dòng tiêu đề ngắn, so khớp không phân biệt hoa thường ("THỰC HÀNH TIẾNG VIỆT" / "Thực hành tiếng Việt")
    const sec = l.length <= 40 ? SECTION_HEADINGS[l.toLocaleUpperCase("vi")] : undefined;
    if (sec) out.push({ line: i, heading: sec });
  });
  return out;
}

/** Nhận diện "Tập 1/2" từ tên tệp hoặc trang bìa. */
export function detectVolume(fileName: string, firstPages: string[]): string | null {
  const f = fileName.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const m = f.match(/tap[\s_-]*(\d)/);
  if (m) return `Tập ${m[1]}`;
  const cover = firstPages.join(" ").toUpperCase();
  if (/TẬP\s*MỘT/.test(cover)) return "Tập 1";
  if (/TẬP\s*HAI/.test(cover)) return "Tập 2";
  return null;
}

/** Trang mục lục: chứa nhiều tên bài nên dễ "trúng" mọi truy vấn — được hạ điểm khi tìm kiếm. */
export function isTableOfContents(p: PageMarker) {
  const head = p.lines.slice(0, 3).join(" ").toUpperCase();
  return /MỤC LỤC|^(TT|BÀI) NỘI DUNG TRANG/.test(head);
}
