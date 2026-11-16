import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "./constants";
import { signSession, verifySession, type SessionPayload } from "./jwt";

export async function createSessionCookie(payload: SessionPayload) {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** Dùng trong Server Component / Server Action: bắt buộc đăng nhập. */
export async function requireSession(roles?: UserRole[]): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (roles && !roles.includes(session.role)) redirect("/dashboard?error=forbidden");
  return session;
}

/** Dùng cho giáo viên: đảm bảo tài khoản có hồ sơ Teacher. */
export async function requireTeacher() {
  const session = await requireSession();
  if (!session.teacherId) redirect("/dashboard?error=no-teacher-profile");
  return session as SessionPayload & { teacherId: string };
}
