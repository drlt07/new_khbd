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
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ", details: err.flatten().fieldErrors },
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
