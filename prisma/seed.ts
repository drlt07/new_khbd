/**
 * DỮ LIỆU MẪU (tên hư cấu, isSample = true, hiển thị nhãn "Dữ liệu mẫu").
 * Chạy lại an toàn: xóa dữ liệu mẫu cũ của tài khoản demo rồi tạo lại.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { assignToGroups, weightedAverage } from "../src/lib/grouping/match";
import { GROUP_PRESETS } from "../src/lib/grouping/presets";
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

async function main() {
  const passwordHash = await bcrypt.hash("Demo@1234", 12);
  const user = await prisma.user.upsert({
    where: { email: "giaovien@demo.vn" },
    update: { passwordHash },
    create: { email: "giaovien@demo.vn", passwordHash, fullName: "Cô Nguyễn Thu Hà" },
  });
  await prisma.class.deleteMany({ where: { ownerId: user.id, isSample: true } });

  for (const [name, rows] of [["12A1", CLASS_12A1], ["10A1", CLASS_10A1]] as const) {
    const cls = await prisma.class.create({
      data: {
        ownerId: user.id, name, schoolYear: "2026-2027", isSample: true,
        students: {
          create: rows.map(([fullName, interests, strengths, needs], i) => ({
            fullName, studentCode: `${name}-${String(i + 1).padStart(2, "0")}`, isSample: true,
            traits: {
              create: [
                ...interests.map((label) => ({ kind: "INTEREST" as const, label })),
                ...strengths.map((label) => ({ kind: "STRENGTH" as const, label })),
                ...needs.map((label) => ({ kind: "NEED" as const, label })),
              ],
            },
          })),
        },
      },
      include: { students: true },
    });

    if (name === "12A1") {
      // Bảng điểm Ngữ văn mẫu (TX1, Giữa kỳ, Cuối kỳ) — điểm hư cấu
      const SCORES: number[][] = [[7, 6.5, 7], [8, 8.5, 8], [6, 5.5, 6], [7.5, 7, 8], [5, 5.5, 5], [8.5, 9, 8.5], [7, 7.5, 7], [6.5, 6, 6.5], [5.5, 6, 5], [7, 6.5, 6.5],
        [8, 7.5, 8], [9, 8.5, 9], [6, 6.5, 6], [7.5, 8, 7.5], [5, 4.5, 5.5], [8, 8, 7.5], [7.5, 8, 8.5], [6.5, 6, 6], [5.5, 5, 6], [8.5, 8, 9]];
      const cols = [["TX1", 1], ["Giữa kỳ", 2], ["Cuối kỳ", 3]] as const;
      const sheet = await prisma.scoreSheet.create({ data: { classId: cls.id, subject: "Ngữ văn", fileName: "bang-diem-mau-12A1.xlsx" } });
      const byName = new Map(cls.students.map((s) => [s.fullName, s.id]));
      for (const [ci, [label, weight]] of cols.entries()) {
        const col = await prisma.scoreColumn.create({ data: { sheetId: sheet.id, label, weight, sortOrder: ci } });
        await prisma.studentScore.createMany({ data: rows.map(([fullName], i) => ({ columnId: col.id, studentId: byName.get(fullName)!, value: SCORES[i][ci] })) });
      }
      const preset = GROUP_PRESETS[0].groups;
      const students = rows.map(([fullName, interests, strengths, needs], i) => ({
        id: byName.get(fullName)!, fullName, interests, strengths, needs,
        score: weightedAverage(cols.map(([, w], ci) => ({ value: SCORES[i][ci], weight: w }))),
      }));
      const assignment = assignToGroups(students, preset, true);
      const grouping = await prisma.grouping.create({ data: { classId: cls.id, title: "Nhóm Ngữ văn – Học kỳ I", subject: "Ngữ văn", scoreSheetId: sheet.id, isSample: true } });
      const groups = [];
      for (const [gi, g] of preset.entries()) {
        groups.push(await prisma.group.create({
          data: {
            groupingId: grouping.id, name: g.name, profile: g.profile, keywords: g.keywords, scoreMin: g.scoreMin, scoreMax: g.scoreMax, forSupport: g.forSupport, sortOrder: gi,
            members: { create: assignment.filter((a) => a.groupIndex === gi).map((a) => ({ studentId: a.studentId, reason: a.reason })) },
          },
        }));
      }
      const lesson = { subject: "Ngữ văn", title: "Tây Tiến (Quang Dũng)", periods: 2, requirements: "Phân tích được hình tượng người lính Tây Tiến và bút pháp lãng mạn của bài thơ\nNhận biết và phân tích được một số yếu tố của thơ trữ tình hiện đại" };
      const draft = buildLessonDraft(lesson, groups);
      await prisma.lessonPlan.create({
        data: {
          ...lesson, groupingId: grouping.id, isSample: true,
          knowledgeGoals: "Hiểu vẻ đẹp hình tượng người lính Tây Tiến; đặc sắc bút pháp lãng mạn, bi tráng.",
          competencyGoals: "Năng lực đọc hiểu thơ trữ tình; năng lực hợp tác, giao tiếp; năng lực sáng tạo.",
          qualityGoals: "Trân trọng, biết ơn thế hệ đi trước; yêu nước.",
          materials: "SGK Ngữ văn 12, phiếu học tập theo nhóm, máy chiếu, giấy A0.",
          activities: {
            create: draft.map((a, i) => ({
              phase: a.phase, title: a.title, minutes: a.minutes, goal: a.goal, content: a.content, product: a.product, organization: a.organization, byGroup: a.byGroup, sortOrder: i,
              tasks: { create: a.tasks.map((t) => ({ groupId: t.groupId, task: t.task, product: t.product, support: t.support })) },
            })),
          },
        },
      });
    }
  }
  console.log("✔ Dữ liệu mẫu đã sẵn sàng. Đăng nhập: giaovien@demo.vn / Demo@1234");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
