import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { UserRole } from "@prisma/client";
import { getSession } from "./auth/session";
import type { SessionPayload } from "./auth/jwt";

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

export const ok = <T>(data: T, init?: ResponseInit) => NextResponse.json({ data }, init);

export function handleApiError(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message, details: err.details }, { status: err.status });
  }
  if (err instanceof ZodError) {
    const { fieldErrors, formErrors } = err.flatten();
    // Lỗi ở mức gốc (không gắn field) -> dùng làm thông báo chính
    return NextResponse.json(
      { error: formErrors[0] ?? "Dữ liệu không hợp lệ", details: fieldErrors },
      { status: 422 },
    );
  }
  console.error("[api] unexpected error", err);
  return NextResponse.json({ error: "Đã xảy ra lỗi hệ thống" }, { status: 500 });
}

export async function requireApiSession(roles?: UserRole[]): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new ApiError(401, "Bạn cần đăng nhập");
  if (roles && !roles.includes(session.role)) throw new ApiError(403, "Bạn không có quyền thực hiện thao tác này");
  return session;
}

export type TeacherSession = SessionPayload & { teacherId: string };

export async function requireApiTeacher(): Promise<TeacherSession> {
  const session = await requireApiSession();
  if (!session.teacherId) throw new ApiError(403, "Tài khoản chưa có hồ sơ giáo viên");
  return session as TeacherSession;
}

type RouteCtx<P> = { params: Promise<P> };

/** Bọc route handler: xác thực giáo viên + xử lý lỗi thống nhất. */
export function teacherRoute<P = Record<string, never>>(
  handler: (args: { req: Request; session: TeacherSession; params: P }) => Promise<Response>,
) {
  return async (req: Request, ctx: RouteCtx<P>) => {
    try {
      const session = await requireApiTeacher();
      const params = ctx?.params ? await ctx.params : ({} as P);
      return await handler({ req, session, params });
    } catch (err) {
      return handleApiError(err);
    }
  };
}

export async function readJson(req: Request) {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, "Nội dung yêu cầu không phải JSON hợp lệ");
  }
}
