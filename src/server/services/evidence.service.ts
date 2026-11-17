import "server-only";
import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import type { EvidenceFilter, EvidenceMeta, evidenceNoteSchema, evidenceUpdateSchema } from "@/schemas/evidence";
import type { z } from "zod";
import { getStorage, newStorageKey } from "@/server/storage";
import { FILE_KIND_META, MAX_FILE_BYTES, MAX_FILES_PER_UPLOAD, detectFileKind, kindFromMime } from "@/server/storage/file-types";
import { extractContent } from "@/server/extraction";
import { matchStudents } from "@/server/extraction/student-matcher";
import { assertClassOwner } from "./authz";

export const EVIDENCE_PAGE_SIZE = 20;

/** Đảm bảo học sinh / tiêu chí / môn học đều thuộc phạm vi của giáo viên và lớp. */
async function validateLinks(
  teacherId: string,
  classId: string,
  opts: { studentIds?: string[]; criteriaIds?: string[]; subjectId?: string | null },
) {
  if (opts.studentIds?.length) {
    const n = await prisma.student.count({ where: { id: { in: opts.studentIds }, classId } });
    if (n !== new Set(opts.studentIds).size) throw new ApiError(422, "Có học sinh không thuộc lớp đã chọn", { studentIds: ["Học sinh không thuộc lớp"] });
  }
  if (opts.criteriaIds?.length) {
    const n = await prisma.assessmentCriteria.count({ where: { id: { in: opts.criteriaIds }, framework: { ownerId: teacherId } } });
    if (n !== new Set(opts.criteriaIds).size) throw new ApiError(422, "Tiêu chí không hợp lệ", { criteriaIds: ["Tiêu chí không hợp lệ"] });
  }
  if (opts.subjectId) {
    const ok = await prisma.classSubject.findFirst({ where: { classId, subjectId: opts.subjectId } });
    if (!ok) throw new ApiError(422, "Môn học không thuộc lớp đã chọn", { subjectId: ["Môn học không thuộc lớp"] });
  }
}

async function assertEvidenceOwner(teacherId: string, id: string) {
  const e = await prisma.studentEvidence.findFirst({ where: { id, class: { ownerId: teacherId } } });
  if (!e) throw new ApiError(404, "Không tìm thấy minh chứng");
  return e;
}

/** Trích xuất nội dung + gợi ý học sinh liên quan. Cập nhật trạng thái xử lý theo từng bước. */
export async function runExtraction(evidenceId: string) {
  const ev = await prisma.studentEvidence.update({ where: { id: evidenceId }, data: { processingStatus: "EXTRACTING", processingError: null } });
  try {
    let text = ev.textContent ?? "";
    let extractedData: Prisma.InputJsonValue = {};
    let note: string | null = null;

    if (ev.storageKey) {
      const kind = kindFromMime(ev.mimeType);
      if (!kind) throw new Error("Không xác định được loại tệp");
      const result = await extractContent(kind, await getStorage().get(ev.storageKey));
      text = result.text;
      note = result.note ?? null;
      extractedData = { tables: result.tables ?? [], pageCount: result.pageCount ?? null } as Prisma.InputJsonValue;
    }

    const students = await prisma.student.findMany({ where: { classId: ev.classId }, select: { id: true, fullName: true, studentCode: true } });
    const matches = matchStudents(text, students);

    return await prisma.studentEvidence.update({
      where: { id: evidenceId },
      data: {
        textContent: text || null,
        extractedData: { ...(extractedData as object), studentMatches: matches, matcher: "deterministic-name-match" },
        extractionNote: note,
        processingStatus: "EXTRACTED",
        extractedAt: new Date(),
      },
    });
  } catch (err) {
    console.error("[extraction] failed", evidenceId, err);
    return prisma.studentEvidence.update({
      where: { id: evidenceId },
      data: { processingStatus: "FAILED", processingError: "Không thể trích xuất nội dung tệp (tệp có thể bị hỏng hoặc được bảo vệ bằng mật khẩu)." },
    });
  }
}

export type UploadOutcome =
  | { fileName: string; ok: true; evidenceId: string; status: string; duplicateOf?: string }
  | { fileName: string; ok: false; error: string };

export async function uploadEvidenceFiles(teacherId: string, meta: EvidenceMeta, files: File[]): Promise<UploadOutcome[]> {
  await assertClassOwner(teacherId, meta.classId);
  await validateLinks(teacherId, meta.classId, meta);
  if (!files.length) throw new ApiError(422, "Vui lòng chọn ít nhất một tệp");
  if (files.length > MAX_FILES_PER_UPLOAD) throw new ApiError(422, `Tối đa ${MAX_FILES_PER_UPLOAD} tệp mỗi lần tải`);

  const storage = getStorage();
  const outcomes: UploadOutcome[] = [];
  for (const file of files) {
    const fileName = file.name.slice(0, 255);
    if (file.size === 0) { outcomes.push({ fileName, ok: false, error: "Tệp rỗng" }); continue; }
    if (file.size > MAX_FILE_BYTES) { outcomes.push({ fileName, ok: false, error: "Tệp vượt quá 10 MB" }); continue; }
    const buf = Buffer.from(await file.arrayBuffer());
    const detected = detectFileKind(fileName, buf);
    if ("error" in detected) { outcomes.push({ fileName, ok: false, error: detected.error }); continue; }

    const { mime, ext } = FILE_KIND_META[detected.kind];
    const checksum = createHash("sha256").update(buf).digest("hex");
    const duplicate = await prisma.studentEvidence.findFirst({ where: { classId: meta.classId, checksum }, select: { id: true } });
    const storageKey = newStorageKey("evidence", ext);
    await storage.put(storageKey, buf, mime);

    const ev = await prisma.studentEvidence.create({
      data: {
        classId: meta.classId,
        subjectId: meta.subjectId ?? null,
        uploadedById: teacherId,
        type: meta.type,
        source: "FILE_UPLOAD",
        title: files.length === 1 && meta.title ? meta.title : fileName.replace(/\.[^.]+$/, ""),
        description: meta.description,
        fileName,
        mimeType: mime,
        sizeBytes: buf.length,
        storageKey,
        checksum,
        collectedAt: meta.collectedAt ?? new Date(),
        students: { create: meta.studentIds.map((studentId) => ({ studentId })) },
        criteria: { connect: meta.criteriaIds.map((id) => ({ id })) },
      },
    });
    const done = await runExtraction(ev.id);
    outcomes.push({ fileName, ok: true, evidenceId: ev.id, status: done.processingStatus, duplicateOf: duplicate?.id });
  }
  return outcomes;
}

export async function createTextEvidence(teacherId: string, input: z.infer<typeof evidenceNoteSchema>) {
  await assertClassOwner(teacherId, input.classId);
  await validateLinks(teacherId, input.classId, input);
  const ev = await prisma.studentEvidence.create({
    data: {
      classId: input.classId,
      subjectId: input.subjectId ?? null,
      uploadedById: teacherId,
      type: input.type,
      source: "FREE_TEXT_NOTE",
      title: input.title,
      description: input.description,
      textContent: input.textContent,
      collectedAt: input.collectedAt ?? new Date(),
      students: { create: input.studentIds.map((studentId) => ({ studentId })) },
      criteria: { connect: input.criteriaIds.map((id) => ({ id })) },
    },
  });
  return runExtraction(ev.id);
}

export async function listEvidence(teacherId: string, f: EvidenceFilter) {
  const where: Prisma.StudentEvidenceWhereInput = {
    class: { ownerId: teacherId },
    ...(f.classId ? { classId: f.classId } : {}),
    ...(f.studentId ? { students: { some: { studentId: f.studentId } } } : {}),
    ...(f.type ? { type: f.type } : {}),
    ...(f.status ? { processingStatus: f.status } : {}),
    ...(f.q
      ? { OR: [{ title: { contains: f.q, mode: "insensitive" } }, { fileName: { contains: f.q, mode: "insensitive" } }, { textContent: { contains: f.q, mode: "insensitive" } }] }
      : {}),
  };
  const [total, items] = await Promise.all([
    prisma.studentEvidence.count({ where }),
    prisma.studentEvidence.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (f.page - 1) * EVIDENCE_PAGE_SIZE,
      take: EVIDENCE_PAGE_SIZE,
      select: {
        id: true, title: true, type: true, source: true, fileName: true, mimeType: true, sizeBytes: true,
        processingStatus: true, collectedAt: true, createdAt: true,
        class: { select: { id: true, name: true } },
        subject: { select: { name: true } },
        students: { select: { student: { select: { id: true, fullName: true } } } },
        _count: { select: { criteria: true } },
      },
    }),
  ]);
  return { total, items, page: f.page, pageCount: Math.max(1, Math.ceil(total / EVIDENCE_PAGE_SIZE)) };
}
export type EvidenceListItem = Awaited<ReturnType<typeof listEvidence>>["items"][number];

export async function getEvidence(teacherId: string, id: string) {
  await assertEvidenceOwner(teacherId, id);
  return prisma.studentEvidence.findUniqueOrThrow({
    where: { id },
    include: {
      class: { select: { id: true, name: true, schoolYear: true } },
      subject: { select: { id: true, name: true } },
      uploadedBy: { select: { user: { select: { fullName: true } } } },
      students: { include: { student: { select: { id: true, fullName: true, studentCode: true } } } },
      criteria: { select: { id: true, name: true, dimension: true } },
    },
  });
}
export type EvidenceDetail = Awaited<ReturnType<typeof getEvidence>>;

export async function updateEvidence(teacherId: string, id: string, input: z.infer<typeof evidenceUpdateSchema>) {
  const ev = await assertEvidenceOwner(teacherId, id);
  await validateLinks(teacherId, ev.classId, input);
  if (input.textContent !== undefined && ev.storageKey) throw new ApiError(422, "Không thể sửa nội dung của minh chứng dạng tệp");
  const { studentIds, criteriaIds, textContent, ...rest } = input;
  const updated = await prisma.$transaction(async (tx) => {
    if (studentIds) {
      await tx.evidenceStudentLink.deleteMany({ where: { evidenceId: id, studentId: { notIn: studentIds } } });
      await tx.evidenceStudentLink.createMany({ data: studentIds.map((studentId) => ({ evidenceId: id, studentId })), skipDuplicates: true });
    }
    return tx.studentEvidence.update({
      where: { id },
      data: {
        ...rest,
        collectedAt: rest.collectedAt ?? undefined,
        ...(textContent !== undefined ? { textContent } : {}),
        ...(criteriaIds ? { criteria: { set: criteriaIds.map((cid) => ({ id: cid })) } } : {}),
      },
    });
  });
  // Văn bản thay đổi -> chạy lại gợi ý học sinh
  if (textContent !== undefined && textContent !== ev.textContent) await runExtraction(id);
  return updated;
}

export async function deleteEvidence(teacherId: string, id: string) {
  const ev = await assertEvidenceOwner(teacherId, id);
  await prisma.studentEvidence.delete({ where: { id } });
  if (ev.storageKey) {
    // Chỉ xóa tệp khi không còn bản ghi nào trỏ tới (an toàn)
    await getStorage().delete(ev.storageKey).catch((e) => console.error("[storage] delete failed", e));
  }
  return ev;
}

export async function reExtract(teacherId: string, id: string) {
  await assertEvidenceOwner(teacherId, id);
  return runExtraction(id);
}

export async function readEvidenceFile(teacherId: string, id: string) {
  const ev = await assertEvidenceOwner(teacherId, id);
  if (!ev.storageKey || !ev.mimeType) throw new ApiError(404, "Minh chứng này không có tệp đính kèm");
  return { ev, data: await getStorage().get(ev.storageKey) };
}
