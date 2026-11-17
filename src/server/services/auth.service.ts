import "server-only";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { ApiError } from "@/lib/api";
import type { SessionPayload } from "@/lib/auth/jwt";
import type { LoginInput, RegisterInput } from "@/schemas/auth";

const toSession = (u: { id: string; fullName: string; email: string }): SessionPayload => ({ userId: u.id, name: u.fullName, email: u.email });

export async function authenticate(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) throw new ApiError(401, "Email hoặc mật khẩu không đúng");
  return toSession(user);
}

export async function registerUser(input: RegisterInput) {
  if (await prisma.user.findUnique({ where: { email: input.email } })) throw new ApiError(409, "Email đã được sử dụng", { email: ["Email đã được sử dụng"] });
  const user = await prisma.user.create({
    data: { email: input.email, fullName: input.fullName, passwordHash: await hashPassword(input.password) },
  });
  return toSession(user);
}
