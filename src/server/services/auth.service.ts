import "server-only";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { ApiError } from "@/lib/api";
import type { SessionPayload } from "@/lib/auth/jwt";
import type { LoginInput, RegisterInput } from "@/schemas/auth";

function toSession(user: {
  id: string;
  email: string;
  fullName: string;
  role: SessionPayload["role"];
  teacher: { id: string } | null;
}): SessionPayload {
  return {
    userId: user.id,
    teacherId: user.teacher?.id ?? null,
    role: user.role,
    name: user.fullName,
    email: user.email,
  };
}

export async function authenticate(input: LoginInput): Promise<SessionPayload> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { teacher: { select: { id: true } } },
  });
  // Thông báo chung để không tiết lộ email nào đã tồn tại
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new ApiError(401, "Email hoặc mật khẩu không đúng");
  }
  if (!user.isActive) throw new ApiError(403, "Tài khoản đã bị khóa");
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return toSession(user);
}

export async function registerTeacher(input: RegisterInput): Promise<SessionPayload> {
  const exists = await prisma.user.findUnique({ where: { email: input.email } });
  if (exists) throw new ApiError(409, "Email đã được sử dụng");

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.$transaction(async (tx) => {
    const school = input.schoolName
      ? await tx.school.create({ data: { name: input.schoolName } })
      : null;
    return tx.user.create({
      data: {
        email: input.email,
        fullName: input.fullName,
        passwordHash,
        role: "TEACHER",
        teacher: { create: { schoolId: school?.id } },
      },
      include: { teacher: { select: { id: true } } },
    });
  });
  return toSession(user);
}
