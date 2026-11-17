/**
 * DỮ LIỆU MẪU (tên hư cấu, isSample = true, hiển thị nhãn "Dữ liệu mẫu").
 * Chạy lại an toàn: xóa dữ liệu mẫu cũ của tài khoản demo rồi tạo lại.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { suggestGroups } from "../src/lib/grouping/algorithm";

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
      const byName = new Map(cls.students.map((s) => [s.fullName, s.id]));
      const groups = suggestGroups(
        rows.map(([fullName, interests, strengths, needs]) => ({ id: byName.get(fullName)!, fullName, interests, strengths, needs })),
        5, "MIXED", 42,
      );
      const tasks = [
        "Phân tích hình tượng người lính Tây Tiến",
        "Vẽ sơ đồ tư duy về bút pháp lãng mạn",
        "Đọc diễn cảm và thuyết trình đoạn thơ yêu thích",
        "Tìm hiểu hoàn cảnh sáng tác, làm video ngắn giới thiệu",
        "Viết đoạn văn cảm nhận và chia sẻ trước lớp",
      ];
      await prisma.grouping.create({
        data: {
          classId: cls.id, title: "Bài 2 – Tây Tiến: thảo luận nhóm", method: "MIXED", isSample: true,
          groups: {
            create: groups.map((g, i) => ({
              name: g.name, task: tasks[i] ?? null, sortOrder: i,
              members: { create: g.members.map((m) => ({ studentId: m.studentId, reason: m.reason })) },
            })),
          },
        },
      });
    }
  }
  console.log("✔ Dữ liệu mẫu đã sẵn sàng. Đăng nhập: giaovien@demo.vn / Demo@1234");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
