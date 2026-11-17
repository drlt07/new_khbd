/**
 * DỮ LIỆU MẪU (tên hư cấu, isSample = true, hiển thị nhãn "Dữ liệu mẫu").
 * Chạy lại an toàn: xóa dữ liệu mẫu cũ của tài khoản demo rồi tạo lại.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { assignToGroups, weightedAverage, type MStudent } from "../src/lib/grouping/match";
import { GROUP_PRESETS } from "../src/lib/grouping/presets";
import { effectiveCriteria } from "../src/lib/grouping/interpret";
import { summarizeGroup } from "../src/lib/grouping/profile";
import { buildLessonDraft } from "../src/lib/lesson/template";

const prisma = new PrismaClient();

// [Họ tên, sở thích, thế mạnh, cần hỗ trợ]
type Row = [string, string[], string[], string[]];

const CLASS_12A1: Row[] = [
  ["Nguyễn Minh An", ["Văn học", "Sáng tác"], ["Viết sáng tạo", "Tưởng tượng"], ["Kỹ năng trình bày"]],
  ["Trần Bảo Châu", ["Hoạt động xã hội"], ["Tổ chức nhóm", "Thuyết trình"], []],
  ["Lê Gia Huy", ["Lập trình"], ["Tư duy logic"], ["Ngại phát biểu"]],
  ["Phạm Khánh Linh", ["Thiết kế", "Hội họa"], ["Vẽ", "Thiết kế đồ họa"], []],
  ["Hoàng Đức Minh", ["Thể thao"], [], ["Cần thêm thời gian"]],
  ["Vũ Ngọc Hân", ["Văn học"], ["Đọc hiểu", "Phân tích"], []],
  ["Đặng Quốc Bảo", ["Lập trình", "Khoa học"], ["Tư duy logic", "Giải quyết vấn đề"], []],
  ["Bùi Thảo Vy", ["Âm nhạc"], ["Thuyết trình"], ["Kỹ năng viết"]],
  ["Đỗ Tuấn Kiệt", ["Thể thao"], [], []],
  ["Ngô Phương Anh", ["Thiết kế"], ["Vẽ"], ["Cần thêm thời gian"]],
  ["Dương Hải Đăng", ["Khoa học"], ["Quan sát"], []],
  ["Lý Thanh Trúc", ["Văn học", "Sân khấu"], ["Diễn xuất", "Thuyết trình"], []],
  ["Phan Nhật Nam", ["Lập trình"], ["Làm video"], ["Kỹ năng trình bày"]],
  ["Trịnh Mai Chi", ["Hoạt động xã hội"], ["Hợp tác", "Lắng nghe"], []],
  ["Võ Thành Đạt", ["Âm nhạc"], [], ["Ngại phát biểu"]],
  ["Mai Hà My", ["Hội họa"], ["Vẽ", "Tưởng tượng"], []],
  ["Tạ Quang Vinh", ["Khoa học"], ["Phân tích"], []],
  ["Hồ Yến Nhi", ["Văn học"], ["Viết sáng tạo"], ["Cần thêm thời gian"]],
  ["Lâm Gia Bảo", [], [], []],
  ["Châu Tú Anh", ["Sân khấu"], ["Thuyết trình", "Tổ chức nhóm"], []],
];

const CLASS_10A1: Row[] = [
  ["Kiều Minh Khang", ["Lập trình"], ["Tư duy logic"], []],
  ["Lương Thu Trang", ["Văn học"], ["Viết sáng tạo"], ["Ngại phát biểu"]],
  ["Quách Đình Phúc", ["Thể thao"], ["Tổ chức nhóm"], []],
  ["Đinh Bảo Ngọc", ["Thiết kế"], ["Vẽ"], []],
  ["Tôn Thất Huy", ["Khoa học"], [], ["Cần thêm thời gian"]],
  ["Văn Ngọc Diệp", ["Âm nhạc"], ["Thuyết trình"], []],
  ["Mạc Quang Tùng", ["Lập trình"], ["Làm video"], []],
  ["Phùng Thị Hoa", ["Văn học"], ["Đọc hiểu"], ["Kỹ năng viết"]],
];

// Điểm Ngữ văn mẫu (TX1, Giữa kỳ, Cuối kỳ) — hư cấu
const SCORES_12A1: number[][] = [[7, 6.5, 7], [8, 8.5, 8], [6, 5.5, 6], [7.5, 7, 8], [5, 5.5, 5], [8.5, 9, 8.5], [7, 7.5, 7], [6.5, 6, 6.5], [5.5, 6, 5], [7, 6.5, 6.5],
  [8, 7.5, 8], [9, 8.5, 9], [6, 6.5, 6], [7.5, 8, 7.5], [5, 4.5, 5.5], [8, 8, 7.5], [7.5, 8, 8.5], [6.5, 6, 6], [5.5, 5, 6], [8.5, 8, 9]];
const SCORES_10A1: number[][] = [[7, 7.5, 8], [8, 8.5, 9], [6, 5.5, 6], [7.5, 7, 7], [5, 5.5, 5], [8, 8, 8.5], [6.5, 7, 7], [5.5, 6, 5.5]];
const COLS = [["TX1", 1], ["Giữa kỳ", 2], ["Cuối kỳ", 3]] as const;

async function main() {
  const passwordHash = await bcrypt.hash("Demo@1234", 12);
  const user = await prisma.user.upsert({
    where: { email: "giaovien@demo.vn" }, update: { passwordHash },
    create: { email: "giaovien@demo.vn", passwordHash, fullName: "Cô Nguyễn Thu Hà" },
  });
  await prisma.class.deleteMany({ where: { ownerId: user.id, isSample: true } });
  const logs: { classId: string; action: string; message: string; href?: string }[] = [];

  for (const [name, rows, scores] of [["12A1", CLASS_12A1, SCORES_12A1], ["10A1", CLASS_10A1, SCORES_10A1]] as const) {
    const cls = await prisma.class.create({
      data: {
        ownerId: user.id, name, schoolYear: "2026-2027", isSample: true,
        students: {
          create: rows.map(([fullName, interests, strengths, needs], i) => ({
            fullName, studentCode: `${name}-${String(i + 1).padStart(2, "0")}`, isSample: true,
            traits: { create: [...interests.map((label) => ({ kind: "INTEREST" as const, label })), ...strengths.map((label) => ({ kind: "STRENGTH" as const, label })), ...needs.map((label) => ({ kind: "NEED" as const, label }))] },
          })),
        },
      },
      include: { students: true },
    });
    const byName = new Map(cls.students.map((s) => [s.fullName, s.id]));
    const sheet = await prisma.scoreSheet.create({ data: { classId: cls.id, subject: "Ngữ văn", fileName: `bang-diem-mau-${name}.xlsx` } });
    for (const [ci, [label, weight]] of COLS.entries()) {
      const col = await prisma.scoreColumn.create({ data: { sheetId: sheet.id, label, weight, sortOrder: ci } });
      await prisma.studentScore.createMany({ data: rows.map(([fullName], i) => ({ columnId: col.id, studentId: byName.get(fullName)!, value: scores[i][ci] })) });
    }
    logs.push({ classId: cls.id, action: "data", message: `Nhập ${rows.length} học sinh và bảng điểm Ngữ văn cho lớp ${name}` });
    if (name !== "12A1") continue;

    // ── Pha 1: phiên phân nhóm "Theo năng lực (4 mức)" — v1 đã duyệt, sau đó v2 thay thế ──
    const students: MStudent[] = rows.map(([fullName, interests, strengths, needs], i) => ({
      id: byName.get(fullName)!, fullName, interests, strengths, needs, score: weightedAverage(COLS.map(([, w], ci) => ({ value: scores[i][ci], weight: w }))),
    }));
    const preset = GROUP_PRESETS[0].groups;
    const vocab = [...new Set(rows.flatMap(([, a, b, c]) => [...a, ...b, ...c]))];
    const eff = effectiveCriteria(preset, vocab, students.map((s) => s.score!));
    const assignment = assignToGroups(students, eff, false);
    const lineageId = randomUUID();
    const slots = preset.map(() => randomUUID());

    async function makeVersion(version: number, status: "CONFIRMED" | "SUPERSEDED", moves: [string, number][] = []) {
      const asg = assignment.map((a) => ({ ...a }));
      for (const [studentName, gi] of moves) { const x = asg.find((a) => a.studentId === byName.get(studentName))!; x.groupIndex = gi; x.reason = "Giáo viên điều chỉnh"; x.fit = "none"; }
      const sess = await prisma.groupingSession.create({
        data: { classId: cls.id, lineageId, version, title: "Nhóm học tập Ngữ văn – HK I", subject: "Ngữ văn", status, step: 4, scoreSheetId: sheet.id, engine: "rules-v1", analyzedAt: new Date(), confirmedAt: new Date(), isSample: true },
      });
      const groups = [];
      for (const [gi, g] of preset.entries()) {
        const members = asg.filter((a) => a.groupIndex === gi);
        const sum = summarizeGroup({ name: g.name, description: g.description, level: eff[gi].level, forSupport: eff[gi].forSupport }, members.map((m) => students.find((s) => s.id === m.studentId)!));
        groups.push(await prisma.groupProfile.create({
          data: {
            sessionId: sess.id, slotKey: slots[gi], name: g.name, description: g.description, keywords: g.keywords, scoreMin: g.scoreMin, scoreMax: g.scoreMax, forSupport: g.forSupport, maxSize: g.maxSize,
            criteria: eff[gi] as object, sortOrder: gi, ...sum,
            members: { create: members.map((m) => ({ studentId: m.studentId, reason: m.reason, fit: m.fit })) },
          },
        }));
      }
      return { sess, groups };
    }
    async function makeLesson(sessionId: string, groups: Awaited<ReturnType<typeof makeVersion>>["groups"], title: string, requirements: string) {
      const lesson = { subject: "Ngữ văn", title, periods: 2, requirements };
      const draft = buildLessonDraft(lesson, groups.map((g) => ({ ...g, profile: g.description })));
      return prisma.lessonPlan.create({
        data: {
          ...lesson, sessionId, isSample: true, engine: "rules-v1", methods: "Dạy học hợp tác, dạy học phân hóa, kĩ thuật mảnh ghép",
          knowledgeGoals: "Hiểu nội dung và đặc sắc nghệ thuật của văn bản.", competencyGoals: "Năng lực đọc hiểu; giao tiếp, hợp tác; sáng tạo.", qualityGoals: "Yêu nước, trân trọng giá trị văn hóa.",
          materials: "SGK Ngữ văn 12, phiếu học tập theo nhóm, máy chiếu, giấy A0.", assessment: "Quan sát, phiếu học tập, sản phẩm nhóm theo rubric.",
          activities: { create: draft.map((a, i) => ({ phase: a.phase, title: a.title, minutes: a.minutes, goal: a.goal, content: a.content, product: a.product, organization: a.organization, byGroup: a.byGroup, sortOrder: i,
            tasks: { create: a.tasks.map((t) => ({ groupId: t.groupId, task: t.task, product: t.product, support: t.support, materials: t.materials, challenge: t.challenge, assessment: t.assessment })) } })) },
        },
      });
    }
    const v1 = await makeVersion(1, "SUPERSEDED");
    const l1 = await makeLesson(v1.sess.id, v1.groups, "Tây Tiến (Quang Dũng)", "Phân tích được hình tượng người lính Tây Tiến và bút pháp lãng mạn của bài thơ");
    const v2 = await makeVersion(2, "CONFIRMED", [["Bùi Thảo Vy", 1]]);
    const l2 = await makeLesson(v2.sess.id, v2.groups, "Việt Bắc (Tố Hữu)", "Phân tích được nghệ thuật biểu hiện tình cảm cách mạng trong đoạn trích");
    logs.push(
      { classId: cls.id, action: "session.confirm", message: "Duyệt hồ sơ nhóm “Nhóm học tập Ngữ văn – HK I” phiên bản 1", href: `/phase1/${v1.sess.id}?step=4` },
      { classId: cls.id, action: "lesson.create", message: "Tạo KHBD “Tây Tiến (Quang Dũng)”", href: `/phase2/${l1.id}` },
      { classId: cls.id, action: "session.confirm", message: "Duyệt hồ sơ nhóm phiên bản 2 (chuyển Bùi Thảo Vy sang Nhóm 2) — 1 KHBD cần cập nhật", href: `/phase1/${v2.sess.id}?step=4` },
      { classId: cls.id, action: "lesson.create", message: "Tạo KHBD “Việt Bắc (Tố Hữu)”", href: `/phase2/${l2.id}` },
    );
  }
  await prisma.activityLog.deleteMany({ where: { userId: user.id } });
  for (const [i, l] of logs.entries()) await prisma.activityLog.create({ data: { ...l, userId: user.id, createdAt: new Date(Date.now() - (logs.length - i) * 3600_000) } });
  console.log("✔ Dữ liệu mẫu đã sẵn sàng. Đăng nhập: giaovien@demo.vn / Demo@1234");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
