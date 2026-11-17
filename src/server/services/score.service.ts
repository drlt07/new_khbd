import "server-only";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import { normText, weightedAverage } from "@/lib/grouping/match";
import { detectScoreTable, DetectError, COMPONENT_LABEL } from "@/lib/scores/detect";
import { readTable } from "@/server/excel/read-table";
import type { ScoreCommit } from "@/schemas/score";
import { assertClassOwner } from "./authz";

const MAX_BYTES = 2 * 1024 * 1024;

async function detect(file: File) {
  if (file.size > MAX_BYTES) throw new ApiError(413, "Tệp vượt quá 2 MB");
  try {
    return detectScoreTable(await readTable(file));
  } catch (e) {
    if (e instanceof DetectError) throw new ApiError(422, e.message);
    throw e;
  }
}

/** Ghép dòng trong file với học sinh của lớp: theo mã HS, rồi theo họ tên (không dấu). */
async function matchStudents(classId: string, rows: { fullName: string; code: string | null }[]) {
  const students = await prisma.student.findMany({ where: { classId }, select: { id: true, fullName: true, studentCode: true } });
  const byCode = new Map(students.filter((s) => s.studentCode).map((s) => [s.studentCode!.toLowerCase(), s.id]));
  const nameCount = new Map<string, number>();
  students.forEach((s) => nameCount.set(normText(s.fullName), (nameCount.get(normText(s.fullName)) ?? 0) + 1));
  const byName = new Map(students.map((s) => [normText(s.fullName), s.id]));
  return rows.map((r) => {
    if (r.code && byCode.has(r.code.toLowerCase())) return { studentId: byCode.get(r.code.toLowerCase())!, by: "code" as const };
    const n = normText(r.fullName);
    if ((nameCount.get(n) ?? 0) > 1) return { studentId: null, by: "ambiguous" as const };
    return byName.has(n) ? { studentId: byName.get(n)!, by: "name" as const } : { studentId: null, by: "none" as const };
  });
}

export async function previewScores(userId: string, classId: string, file: File) {
  await assertClassOwner(userId, classId);
  const d = await detect(file);
  const matches = await matchStudents(classId, d.rows);
  return {
    fileName: file.name,
    nameColumn: d.nameColumn,
    codeColumn: d.codeColumn,
    headerRows: d.headerRows,
    subjects: d.subjects,
    columns: d.scoreColumns.map((c) => ({ ...c, componentLabel: COMPONENT_LABEL[c.component] })),
    rows: d.rows.map((r, i) => ({ ...r, match: matches[i].by, matched: !!matches[i].studentId })),
    matched: matches.filter((m) => m.studentId).length,
    unmatched: matches.filter((m) => !m.studentId).length,
  };
}

export async function commitScores(userId: string, classId: string, file: File, opts: ScoreCommit) {
  await assertClassOwner(userId, classId);
  const d = await detect(file);
  const valid = new Set(d.scoreColumns.map((c) => c.index));
  if (!opts.columns.every((c) => valid.has(c.index))) throw new ApiError(422, "Cột điểm không còn khớp với tệp — vui lòng tải lại");
  const matches = await matchStudents(classId, d.rows);

  return prisma.$transaction(async (tx) => {
    const ids: (string | null)[] = [];
    let created = 0;
    for (const [i, r] of d.rows.entries()) {
      let id = matches[i].studentId;
      if (!id && opts.createMissing && matches[i].by === "none") {
        id = (await tx.student.create({ data: { classId, fullName: r.fullName, studentCode: r.code } })).id;
        created++;
      }
      ids.push(id);
    }
    const sheet = await tx.scoreSheet.create({ data: { classId, subject: opts.subject, fileName: file.name } });
    let scores = 0;
    for (const [ci, col] of opts.columns.entries()) {
      const column = await tx.scoreColumn.create({ data: { sheetId: sheet.id, label: col.label, weight: col.weight, sortOrder: ci } });
      const data = d.rows.flatMap((r, i) => (ids[i] && r.scores[col.index] != null ? [{ columnId: column.id, studentId: ids[i]!, value: r.scores[col.index] }] : []));
      await tx.studentScore.createMany({ data, skipDuplicates: true });
      scores += data.length;
    }
    return { sheetId: sheet.id, students: ids.filter(Boolean).length, created, skipped: ids.filter((x) => !x).length, scores };
  });
}

export async function listScoreSheets(userId: string, classId: string) {
  await assertClassOwner(userId, classId);
  return prisma.scoreSheet.findMany({
    where: { classId },
    orderBy: { createdAt: "desc" },
    include: { columns: { orderBy: { sortOrder: "asc" }, include: { scores: { select: { studentId: true, value: true } } } }, _count: { select: { groupings: true } } },
  });
}

/** Điểm trung bình (theo hệ số) của từng học sinh trong một bảng điểm */
export async function sheetAverages(sheetId: string | null | undefined) {
  const map = new Map<string, number>();
  if (!sheetId) return map;
  const cols = await prisma.scoreColumn.findMany({ where: { sheetId }, include: { scores: true } });
  const per = new Map<string, { value: number; weight: number }[]>();
  for (const c of cols) for (const s of c.scores) per.set(s.studentId, [...(per.get(s.studentId) ?? []), { value: s.value, weight: c.weight }]);
  per.forEach((list, sid) => { const avg = weightedAverage(list); if (avg != null) map.set(sid, avg); });
  return map;
}

export async function deleteScoreSheet(userId: string, id: string) {
  const sheet = await prisma.scoreSheet.findFirst({ where: { id, class: { ownerId: userId } } });
  if (!sheet) throw new ApiError(404, "Không tìm thấy bảng điểm");
  await prisma.scoreSheet.delete({ where: { id } });
}
