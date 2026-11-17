import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSession } from "./auth/session";
import type { SessionPayload } from "./auth/jwt";

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

export const ok = <T>(data: T, init?: ResponseInit) => NextResponse.json({ data }, init);

export function handleApiError(err: unknown) {
  if (err instanceof ApiError) return NextResponse.json({ error: err.message, details: err.details }, { status: err.status });
  if (err instanceof ZodError) {
    const { fieldErrors, formErrors } = err.flatten();
    return NextResponse.json({ error: formErrors[0] ?? "Dữ liệu không hợp lệ", details: fieldErrors }, { status: 422 });
  }
  console.error("[api] unexpected error", err);
  return NextResponse.json({ error: "Đã xảy ra lỗi hệ thống" }, { status: 500 });
}

export async function readJson(req: Request) {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, "Nội dung yêu cầu không phải JSON hợp lệ");
  }
}

/** Bọc route handler: bắt buộc đăng nhập + xử lý lỗi thống nhất. */
export function userRoute<P = Record<string, never>>(
  handler: (args: { req: Request; session: SessionPayload; params: P }) => Promise<Response>,
) {
  return async (req: Request, ctx: { params: Promise<P> }) => {
    try {
      const session = await getSession();
      if (!session) throw new ApiError(401, "Bạn cần đăng nhập");
      return await handler({ req, session, params: ctx?.params ? await ctx.params : ({} as P) });
    } catch (err) {
      return handleApiError(err);
    }
  };
}
