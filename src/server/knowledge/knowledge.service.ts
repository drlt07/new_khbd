import "server-only";
import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import { getStorage, newStorageKey } from "@/server/storage";
import { FILE_KIND_META, detectFileKind, kindFromMime } from "@/server/storage/file-types";
import type { collectionInputSchema, collectionUpdateSchema, documentUpdateSchema } from "@/schemas/knowledge";
import { assertSubjectAccessible } from "./access";
import { TOC_HEADING, chunkPages } from "./chunker";
import { extractPages } from "./extract-pages";
import { detectVolume, toPageMarker, type Lesson, type OutlineItem } from "./structure";
import { foldVietnamese, toSearchText } from "./text";

export const KNOWLEDGE_MAX_BYTES = 50 * 1024 * 1024;
export const KNOWLEDGE_MAX_FILES = 10;

async function assertCollectionOwner(teacherId: string, id: string) {
  const c = await prisma.knowledgeCollection.findFirst({ where: { id, ownerId: teacherId } });
  if (!c) throw new ApiError(404, "Không tìm thấy bộ tài liệu");
  return c;
}
async function assertDocumentOwner(teacherId: string, id: string) {
  const d = await prisma.knowledgeDocument.findFirst({ where: { id, collection: { ownerId: teacherId } } });
  if (!d) throw new ApiError(404, "Không tìm thấy tài liệu");
  return d;
}

// ───────────── Bộ tài liệu (collection) ─────────────

export async function listCollections(teacherId: string) {
  return prisma.knowledgeCollection.findMany({
    where: { ownerId: teacherId },
    orderBy: { createdAt: "asc" },
    include: {
      subject: { select: { id: true, name: true } },
      documents: { select: { pageCount: true, chunkCount: true, processingStatus: true } },
    },
  });
}

export async function createCollection(teacherId: string, input: z.infer<typeof collectionInputSchema>) {
  if (input.subjectId) await assertSubjectAccessible(teacherId, input.subjectId);
  const dup = await prisma.knowledgeCollection.findFirst({ where: { ownerId: teacherId, name: { equals: input.name, mode: "insensitive" } } });
  if (dup) throw new ApiError(409, "Đã có bộ tài liệu cùng tên", { name: ["Tên đã tồn tại"] });
  return prisma.knowledgeCollection.create({ data: { ...input, gradeLevel: input.gradeLevel ?? null, ownerId: teacherId } });
}

export async function updateCollection(teacherId: string, id: string, input: z.infer<typeof collectionUpdateSchema>) {
  await assertCollectionOwner(teacherId, id);
  if (input.subjectId) await assertSubjectAccessible(teacherId, input.subjectId);
  return prisma.knowledgeCollection.update({ where: { id }, data: input });
}

export async function deleteCollection(teacherId: string, id: string) {
  const c = await assertCollectionOwner(teacherId, id);
  const docs = await prisma.knowledgeDocument.findMany({ where: { collectionId: id }, select: { storageKey: true } });
  await prisma.knowledgeCollection.delete({ where: { id } });
  for (const d of docs) await getStorage().delete(d.storageKey).catch(() => {});
  return c;
}

export async function getCollection(teacherId: string, id: string) {
  await assertCollectionOwner(teacherId, id);
  const c = await prisma.knowledgeCollection.findUniqueOrThrow({
    where: { id },
    include: {
      subject: { select: { id: true, name: true } },
      documents: {
        orderBy: [{ volume: "asc" }, { bookPageStart: "asc" }, { createdAt: "asc" }],
        include: { uploadedBy: { select: { user: { select: { fullName: true } } } } },
      },
    },
  });
  // Mục lục tổng hợp theo bài học (theo thứ tự tập -> trang)
  const lessons = await prisma.knowledgeChunk.groupBy({
    by: ["lessonLabel", "lessonTitle", "documentId"],
    where: { collectionId: id },
    _count: true,
    _min: { bookPage: true, pdfPage: true },
    _max: { bookPage: true },
  });
  const docOrder = new Map(c.documents.map((d, i) => [d.id, i]));
  const byLesson = new Map<string, { label: string; title: string | null; volume: string | null; chunks: number; fromPage: number | null; toPage: number | null; order: number; documentIds: string[] }>();
  for (const l of lessons) {
    const doc = c.documents.find((d) => d.id === l.documentId)!;
    const key = `${doc.volume ?? ""}|${l.lessonLabel ?? "?"}`;
    const order = (docOrder.get(l.documentId) ?? 0) * 100000 + (l._min.pdfPage ?? 0);
    const cur = byLesson.get(key);
    if (!cur) {
      byLesson.set(key, { label: l.lessonLabel ?? "Chưa xác định bài", title: l.lessonTitle, volume: doc.volume, chunks: l._count, fromPage: l._min.bookPage, toPage: l._max.bookPage, order, documentIds: [l.documentId] });
    } else {
      cur.chunks += l._count;
      cur.title ??= l.lessonTitle;
      cur.fromPage = Math.min(cur.fromPage ?? Infinity, l._min.bookPage ?? Infinity);
      cur.toPage = Math.max(cur.toPage ?? 0, l._max.bookPage ?? 0);
      cur.order = Math.min(cur.order, order);
      cur.documentIds.push(l.documentId);
    }
  }
  return { ...c, lessons: [...byLesson.values()].sort((a, b) => a.order - b.order) };
}
export type CollectionDetail = Awaited<ReturnType<typeof getCollection>>;

// ───────────── Tài liệu ─────────────

export type KnowledgeUploadOutcome = { fileName: string; ok: true; documentId: string; status: string } | { fileName: string; ok: false; error: string };

export async function uploadDocuments(teacherId: string, collectionId: string, files: File[]): Promise<KnowledgeUploadOutcome[]> {
  await assertCollectionOwner(teacherId, collectionId);
  if (!files.length) throw new ApiError(422, "Vui lòng chọn tệp");
  if (files.length > KNOWLEDGE_MAX_FILES) throw new ApiError(422, `Tối đa ${KNOWLEDGE_MAX_FILES} tệp mỗi lần`);
  const out: KnowledgeUploadOutcome[] = [];
  for (const file of files) {
    const fileName = file.name.slice(0, 255);
    if (file.size > KNOWLEDGE_MAX_BYTES) { out.push({ fileName, ok: false, error: "Tệp vượt quá 50 MB" }); continue; }
    const buf = Buffer.from(await file.arrayBuffer());
    const det = detectFileKind(fileName, buf);
    if ("error" in det) { out.push({ fileName, ok: false, error: det.error }); continue; }
    if (det.kind !== "pdf" && det.kind !== "docx") { out.push({ fileName, ok: false, error: "Kho tài liệu chỉ nhận PDF hoặc DOCX" }); continue; }
    const checksum = createHash("sha256").update(buf).digest("hex");
    const dup = await prisma.knowledgeDocument.findFirst({ where: { collectionId, checksum }, select: { title: true } });
    if (dup) { out.push({ fileName, ok: false, error: `Tài liệu đã có trong bộ (“${dup.title}”)` }); continue; }

    const { mime, ext } = FILE_KIND_META[det.kind];
    const storageKey = newStorageKey("knowledge", ext);
    await getStorage().put(storageKey, buf, mime);
    const doc = await prisma.knowledgeDocument.create({
      data: {
        collectionId, uploadedById: teacherId, fileName, mimeType: mime, sizeBytes: buf.length, storageKey, checksum,
        title: prettifyTitle(fileName),
      },
    });
    const done = await processDocument(doc.id);
    out.push({ fileName, ok: true, documentId: doc.id, status: done.processingStatus });
  }
  return out;
}

/** "04f83c61-Sach_giao_vien_-_ngu_van_12_-_tap_1.pdf" -> "Sach giao vien - ngu van 12 - tap 1" */
function prettifyTitle(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").replace(/^[0-9a-f]{8}-/, "").replace(/_/g, " ").replace(/\s+/g, " ").trim();
}

/** Bài đang dở ở cuối phần trước (cùng tập, trang liền kề) — để phần sau kế thừa. */
async function findPredecessorLesson(doc: { id: string; collectionId: string; volume: string | null; bookPageStart: number | null }): Promise<Lesson | null> {
  if (!doc.bookPageStart || doc.bookPageStart <= 1) return null;
  const prev = await prisma.knowledgeDocument.findFirst({
    where: { collectionId: doc.collectionId, id: { not: doc.id }, volume: doc.volume, bookPageEnd: doc.bookPageStart - 1, processingStatus: "EXTRACTED" },
  });
  if (!prev) return null;
  const last = await prisma.knowledgeChunk.findFirst({ where: { documentId: prev.id }, orderBy: { chunkIndex: "desc" } });
  return last?.lessonLabel ? { label: last.lessonLabel, title: last.lessonTitle } : null;
}

export async function processDocument(documentId: string, depth = 0): Promise<{ processingStatus: string }> {
  const doc = await prisma.knowledgeDocument.update({ where: { id: documentId }, data: { processingStatus: "EXTRACTING", processingError: null } });
  try {
    const kind = kindFromMime(doc.mimeType);
    if (!kind) throw new Error("Loại tệp không hợp lệ");
    const raw = await extractPages(kind, await getStorage().get(doc.storageKey));
    const pages = raw.map((t, i) => toPageMarker(i + 1, t));
    const bookPages = pages.map((p) => p.bookPage).filter((n): n is number => n !== null);
    const bookPageStart = pages[0]?.bookPage ?? (bookPages.length ? bookPages[0] - 1 : null);
    const bookPageEnd = bookPages.length ? bookPages[bookPages.length - 1] : null;
    const volume = doc.volume ?? detectVolume(doc.fileName, raw.slice(0, 2));

    // Tài liệu bắt đầu từ đầu sách -> phần trước bài 1 là "Hướng dẫn chung"; nếu bắt đầu giữa sách -> kế thừa phần trước
    const startsAtBeginning = !bookPageStart || bookPageStart <= 5 || /SÁCH GIÁO VIÊN|SÁCH GIÁO KHOA/i.test(raw[0] ?? "");
    const initial = startsAtBeginning
      ? { label: "Hướng dẫn chung", title: "Phần đầu sách" }
      : await findPredecessorLesson({ id: doc.id, collectionId: doc.collectionId, volume, bookPageStart });

    const { chunks, outline } = chunkPages(pages, initial);
    const charCount = chunks.reduce((a, c) => a + c.charCount, 0);
    if (charCount < 200) throw new Error("NO_TEXT");

    await prisma.$transaction(async (tx) => {
      await tx.knowledgeChunk.deleteMany({ where: { documentId } });
      for (let i = 0; i < chunks.length; i += 500) {
        await tx.knowledgeChunk.createMany({
          data: chunks.slice(i, i + 500).map((c) => ({ ...c, documentId, collectionId: doc.collectionId })),
        });
      }
      await tx.knowledgeDocument.update({
        where: { id: documentId },
        data: {
          pageCount: pages.length, bookPageStart, bookPageEnd, volume, charCount, chunkCount: chunks.length,
          outline: outline as unknown as Prisma.InputJsonValue, processingStatus: "EXTRACTED", processedAt: new Date(),
        },
      });
    }, { timeout: 60_000 });

    // Phần tiếp theo của cùng cuốn sách (nếu đã tải trước) cần xử lý lại để kế thừa đúng bài học
    if (depth < 10 && bookPageEnd) {
      const next = await prisma.knowledgeDocument.findFirst({
        where: { collectionId: doc.collectionId, id: { not: documentId }, volume, bookPageStart: bookPageEnd + 1 },
      });
      if (next) await processDocument(next.id, depth + 1);
    }
    return { processingStatus: "EXTRACTED" };
  } catch (err) {
    const noText = err instanceof Error && err.message === "NO_TEXT";
    if (!noText) console.error("[knowledge] process failed", documentId, err);
    await prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: {
        processingStatus: "FAILED",
        processingError: noText
          ? "Tài liệu gần như không có lớp văn bản (có thể là bản scan) — cần OCR trước khi dùng làm tài liệu tham chiếu."
          : "Không thể xử lý tài liệu (tệp hỏng hoặc được bảo vệ).",
      },
    });
    return { processingStatus: "FAILED" };
  }
}

export async function getDocument(teacherId: string, id: string) {
  await assertDocumentOwner(teacherId, id);
  return prisma.knowledgeDocument.findUniqueOrThrow({
    where: { id },
    include: { collection: { select: { id: true, name: true } } },
  });
}

export async function listDocumentChunks(teacherId: string, id: string, opts: { lesson?: string; page?: number }) {
  await assertDocumentOwner(teacherId, id);
  const PAGE = 30;
  const where: Prisma.KnowledgeChunkWhereInput = { documentId: id, ...(opts.lesson ? { lessonLabel: opts.lesson } : {}) };
  const [total, items] = await Promise.all([
    prisma.knowledgeChunk.count({ where }),
    prisma.knowledgeChunk.findMany({ where, orderBy: { chunkIndex: "asc" }, skip: ((opts.page ?? 1) - 1) * PAGE, take: PAGE }),
  ]);
  return { total, items, page: opts.page ?? 1, pageCount: Math.max(1, Math.ceil(total / PAGE)) };
}

export async function updateDocument(teacherId: string, id: string, input: z.infer<typeof documentUpdateSchema>) {
  const doc = await assertDocumentOwner(teacherId, id);
  const updated = await prisma.knowledgeDocument.update({ where: { id }, data: input });
  // Đổi "tập" ảnh hưởng tới việc nối các phần -> xử lý lại
  if (input.volume !== undefined && input.volume !== doc.volume) await processDocument(id);
  return updated;
}

export async function deleteDocument(teacherId: string, id: string) {
  const doc = await assertDocumentOwner(teacherId, id);
  await prisma.knowledgeDocument.delete({ where: { id } });
  await getStorage().delete(doc.storageKey).catch(() => {});
  return doc;
}

export async function reprocessDocument(teacherId: string, id: string) {
  await assertDocumentOwner(teacherId, id);
  return processDocument(id);
}

export async function readDocumentFile(teacherId: string, id: string) {
  const doc = await assertDocumentOwner(teacherId, id);
  return { doc, data: await getStorage().get(doc.storageKey) };
}

// ───────────── Truy xuất (dùng cho tìm kiếm & AI) ─────────────

export type KnowledgeHit = {
  id: string; documentId: string; documentTitle: string; volume: string | null;
  pdfPage: number; bookPage: number | null; lessonLabel: string | null; lessonTitle: string | null; heading: string | null;
  content: string; snippet: string; score: number;
};

function makeSnippet(content: string, terms: string[], size = 320) {
  const folded = foldVietnamese(content.normalize("NFC"));
  const text = content.normalize("NFC");
  let pos = -1;
  for (const t of terms) { const i = folded.indexOf(t); if (i >= 0 && (pos < 0 || i < pos)) pos = i; }
  const start = Math.max(0, (pos < 0 ? 0 : pos) - 80);
  const end = Math.min(text.length, start + size);
  return (start > 0 ? "…" : "") + text.slice(start, end).trim() + (end < text.length ? "…" : "");
}

/**
 * Tìm kiếm full-text trên chỉ mục không dấu.
 * Ưu tiên đoạn chứa ĐỦ các từ (AND) + cụm từ liền nhau; bổ sung bằng đoạn chứa một phần (OR) nếu chưa đủ kết quả.
 */
export async function searchKnowledge(
  teacherId: string,
  scope: { collectionId?: string; subjectId?: string },
  q: string,
  opts: { lesson?: string; limit?: number } = {},
): Promise<{ terms: string[]; hits: KnowledgeHit[] }> {
  const limit = opts.limit ?? 10;
  const collections = await prisma.knowledgeCollection.findMany({
    where: { ownerId: teacherId, ...(scope.collectionId ? { id: scope.collectionId } : {}), ...(scope.subjectId ? { subjectId: scope.subjectId } : {}) },
    select: { id: true },
  });
  if (scope.collectionId && !collections.length) throw new ApiError(404, "Không tìm thấy bộ tài liệu");
  const ids = collections.map((c) => c.id);
  const phrase = toSearchText(q);
  const terms = [...new Set(phrase.split(" ").filter((t) => t.length >= 1))].slice(0, 20);
  if (!ids.length || !terms.length) return { terms, hits: [] };

  const andQuery = terms.join(" & ");
  const orQuery = terms.join(" | ");
  const lessonFilter = opts.lesson ? Prisma.sql`AND c."lessonLabel" = ${opts.lesson}` : Prisma.empty;

  const run = (tsq: string, exclude: string[]) => prisma.$queryRaw<(Omit<KnowledgeHit, "snippet">)[]>`
    SELECT c.id, c."documentId", d.title AS "documentTitle", d.volume, c."pdfPage", c."bookPage",
           c."lessonLabel", c."lessonTitle", c.heading, c.content,
           ((ts_rank_cd(to_tsvector('simple', c."searchText"), to_tsquery('simple', ${tsq}))
             + CASE WHEN position(${phrase} in c."searchText") > 0 THEN 1.0 ELSE 0 END)
             * CASE WHEN c.heading = ${TOC_HEADING} THEN 0.2 ELSE 1 END)::float AS score
    FROM "KnowledgeChunk" c
    JOIN "KnowledgeDocument" d ON d.id = c."documentId"
    WHERE c."collectionId" = ANY(${ids})
      AND to_tsvector('simple', c."searchText") @@ to_tsquery('simple', ${tsq})
      AND NOT (c.id = ANY(${exclude}))
      ${lessonFilter}
    ORDER BY score DESC
    LIMIT ${limit}`;

  const strict = await run(andQuery, []);
  const loose = strict.length < limit && terms.length > 1 ? await run(orQuery, strict.map((h) => h.id)) : [];
  const hits = [...strict, ...loose.slice(0, limit - strict.length)].map((h) => ({ ...h, snippet: makeSnippet(h.content, terms) }));
  return { terms, hits };
}

/**
 * Ngữ cảnh tham chiếu cho các tác vụ AI (Phân tích bài học, Tạo KHBD — Sprint 5/6):
 * lấy các đoạn tài liệu liên quan nhất kèm trích dẫn (tài liệu, tập, trang).
 */
export async function retrieveReferenceContext(teacherId: string, subjectId: string, query: string, limit = 6) {
  const { hits } = await searchKnowledge(teacherId, { subjectId }, query, { limit });
  return hits.map((h) => ({
    citation: `${h.documentTitle}${h.volume ? `, ${h.volume}` : ""}, tr. ${h.bookPage ?? h.pdfPage}${h.lessonLabel ? ` (${h.lessonLabel})` : ""}`,
    content: h.content,
  }));
}

export type { OutlineItem };
