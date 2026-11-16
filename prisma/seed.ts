/**
 * DỮ LIỆU MẪU để phát triển & kiểm thử. Mọi bản ghi lớp/học sinh/KHBD đều có isSample = true
 * và được gắn nhãn "Dữ liệu mẫu" trên giao diện. Tên học sinh là tên hư cấu.
 * Chạy lại an toàn: xóa dữ liệu mẫu cũ của tài khoản demo trước khi tạo lại.
 */
import { PrismaClient, type ProfileDimension, type ProfileStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_CRITERIA } from "../src/config/default-framework";

const prisma = new PrismaClient();


const NAMES_10A1 = ["Nguyễn Minh An", "Trần Bảo Châu", "Lê Gia Huy", "Phạm Khánh Linh", "Hoàng Đức Minh", "Vũ Ngọc Hân", "Đặng Quốc Bảo", "Bùi Thảo Vy", "Đỗ Tuấn Kiệt", "Ngô Phương Anh", "Dương Hải Đăng", "Lý Thanh Trúc"];
const NAMES_11A2 = ["Phan Nhật Nam", "Trịnh Mai Chi", "Võ Thành Đạt", "Mai Hà My", "Tạ Quang Vinh", "Hồ Yến Nhi", "Lâm Gia Bảo", "Châu Tú Anh"];
const STATUS_CYCLE: ProfileStatus[] = ["CONFIRMED", "CONFIRMED", "PENDING_REVIEW", "NOT_ANALYZED", "CONFIRMED", "NEEDS_MORE_DATA"];

async function main() {
  const email = "giaovien@demo.vn";
  const passwordHash = await bcrypt.hash("Demo@1234", 12);

  const school =
    (await prisma.school.findFirst({ where: { isSample: true } })) ??
    (await prisma.school.create({ data: { name: "Trường THPT Mẫu (dữ liệu mẫu)", isSample: true } }));

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, isActive: true },
    create: {
      email,
      passwordHash,
      fullName: "Cô Nguyễn Thu Hà",
      role: "TEACHER",
      teacher: { create: { schoolId: school.id, specialization: "Ngữ văn, Tin học" } },
    },
    include: { teacher: true },
  });
  const teacherId = user.teacher!.id;

  await prisma.user.upsert({
    where: { email: "admin@demo.vn" },
    update: { passwordHash },
    create: { email: "admin@demo.vn", passwordHash, fullName: "Quản trị hệ thống", role: "ADMIN", teacher: { create: { schoolId: school.id } } },
  });

  // Dọn dữ liệu mẫu cũ (cascade sẽ xóa học sinh, KHBD...)
  await prisma.class.deleteMany({ where: { ownerId: teacherId, isSample: true } });
  await prisma.assessmentFramework.deleteMany({ where: { ownerId: teacherId, isDefault: true } });

  const [nguVan, tinHoc] = await Promise.all(
    ["Ngữ văn", "Tin học"].map((name) =>
      prisma.subject.upsert({
        where: { schoolId_name: { schoolId: school.id, name } },
        update: {},
        create: { name, schoolId: school.id },
      }),
    ),
  );

  await prisma.assessmentFramework.create({
    data: {
      ownerId: teacherId,
      name: "Khung thông tin mặc định (A–F)",
      description: "Bộ khung mặc định của hệ thống. Giáo viên có thể tùy chỉnh, bổ sung hoặc loại bỏ tiêu chí.",
      isDefault: true,
      criteria: {
        create: Object.entries(DEFAULT_CRITERIA).flatMap(([dimension, names]) =>
          names.map((name, i) => ({ dimension: dimension as ProfileDimension, name, sortOrder: i })),
        ),
      },
    },
  });

  const classes = [
    { name: "10A1", gradeLevel: 10, names: NAMES_10A1, subjects: [nguVan, tinHoc] },
    { name: "11A2", gradeLevel: 11, names: NAMES_11A2, subjects: [tinHoc] },
  ];

  for (const c of classes) {
    const cls = await prisma.class.create({
      data: {
        name: c.name,
        gradeLevel: c.gradeLevel,
        schoolYear: "2026-2027",
        schoolId: school.id,
        ownerId: teacherId,
        isSample: true,
        description: "Lớp mẫu để kiểm thử",
        subjects: { create: c.subjects.map((s) => ({ subjectId: s.id, teacherId })) },
        students: {
          create: c.names.map((fullName, i) => ({
            fullName,
            studentCode: `${c.name}-${String(i + 1).padStart(2, "0")}`,
            profileStatus: STATUS_CYCLE[i % STATUS_CYCLE.length],
            isSample: true,
          })),
        },
      },
      include: { students: true },
    });

    // Ví dụ hồ sơ đa chiều: thế mạnh sáng tạo + nhu cầu hỗ trợ kỹ năng viết (Phần 4.1)
    const s = cls.students[0];
    await prisma.studentInterest.create({ data: { studentId: s.id, title: "Yêu thích sáng tạo văn học", origin: "TEACHER" } });
    await prisma.studentStrength.create({ data: { studentId: s.id, title: "Khả năng tưởng tượng tốt, có ý tưởng sáng tác độc đáo", origin: "TEACHER" } });
    await prisma.studentLearningNeed.create({
      data: { studentId: s.id, title: "Kỹ năng viết và trình bày còn hạn chế", supportStrategy: "Cung cấp dàn ý mẫu, hướng dẫn từng bước", origin: "TEACHER" },
    });
  }

  const cls10 = await prisma.class.findFirstOrThrow({ where: { ownerId: teacherId, name: "10A1", isSample: true } });
  await prisma.lessonPlan.createMany({
    data: [
      { teacherId, classId: cls10.id, subjectId: nguVan.id, title: "Sáng tạo sản phẩm truyền thông từ tác phẩm văn học", topic: "Văn bản thông tin", durationMinutes: 90, status: "GENERATED", wizardStep: 6, isSample: true },
      { teacherId, classId: cls10.id, subjectId: tinHoc.id, title: "Lập trình Python: Cấu trúc rẽ nhánh", topic: "Lập trình cơ bản", durationMinutes: 45, status: "DRAFT", wizardStep: 2, isSample: true },
    ],
  });

  console.log("✔ Đã tạo dữ liệu mẫu. Đăng nhập: giaovien@demo.vn / Demo@1234 (admin: admin@demo.vn / Demo@1234)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
