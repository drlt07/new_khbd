import type { Lesson, PageMarker } from "./structure";
import { detectLessonStart, detectSections, isTableOfContents } from "./structure";

export const TOC_HEADING = "Mục lục";
import { toSearchText } from "./text";

export type Chunk = {
  chunkIndex: number;
  pdfPage: number;
  bookPage: number | null;
  lessonLabel: string | null;
  lessonTitle: string | null;
  heading: string | null;
  content: string;
  searchText: string;
  charCount: number;
};

const TARGET = 1200; // ký tự / đoạn
const OVERLAP = 150; // phần gối đầu giữa hai đoạn liên tiếp trong cùng trang

/**
 * Chia đoạn theo trang (không vượt trang để trích dẫn số trang chính xác),
 * gắn bài học + đề mục đang có hiệu lực tại vị trí đoạn.
 * `initialLesson` dùng khi tài liệu là phần tiếp theo của một cuốn sách (bắt đầu giữa bài).
 */
export function chunkPages(pages: PageMarker[], initialLesson: Lesson | null) {
  const chunks: Chunk[] = [];
  const outline: { kind: "lesson" | "section"; label: string; title: string | null; pdfPage: number; bookPage: number | null }[] = [];
  // null = chưa xác định được bài (tài liệu bắt đầu giữa sách và chưa có phần trước)
  let lesson: Lesson | null = initialLesson;
  let heading: string | null = null;

  for (const p of pages) {
    const start = detectLessonStart(p);
    if (start) {
      lesson = start;
      heading = null;
      outline.push({ kind: "lesson", label: start.label, title: start.title, pdfPage: p.pdfPage, bookPage: p.bookPage });
    }
    const toc = isTableOfContents(p);
    const sections = toc ? [] : detectSections(p);
    for (const s of sections) outline.push({ kind: "section", label: s.heading, title: null, pdfPage: p.pdfPage, bookPage: p.bookPage });

    // Gom dòng thành đoạn; cập nhật đề mục khi đi qua dòng tiêu đề
    let buf: string[] = [];
    let bufHeading: string | null = heading;
    const flush = () => {
      const content = buf.join(" ").replace(/\s+/g, " ").trim();
      if (content.length >= 40) {
        chunks.push({
          chunkIndex: chunks.length,
          pdfPage: p.pdfPage,
          bookPage: p.bookPage,
          lessonLabel: lesson?.label ?? null,
          lessonTitle: lesson?.title ?? null,
          heading: toc ? TOC_HEADING : bufHeading,
          content,
          searchText: toSearchText(content),
          charCount: content.length,
        });
      }
    };
    let size = 0;
    p.lines.forEach((line, i) => {
      const sec = sections.find((s) => s.line === i);
      if (sec) {
        if (size > 300) { flush(); buf = []; size = 0; }
        heading = sec.heading;
        if (!buf.length) bufHeading = heading;
      }
      buf.push(line);
      size += line.length + 1;
      if (size >= TARGET) {
        flush();
        const tail = buf.join(" ").slice(-OVERLAP);
        buf = [tail.slice(tail.indexOf(" ") + 1)];
        size = buf[0].length;
        bufHeading = heading;
      }
    });
    if (size > 0) flush();
  }
  return { chunks, outline, lastLesson: lesson };
}
