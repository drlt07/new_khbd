import { NextRequest } from "next/server";
import { loginSchema } from "@/schemas/auth";
import { authenticate } from "@/server/services/auth.service";
import { createSessionCookie } from "@/lib/auth/session";
import { handleApiError, ok } from "@/lib/api";
import { writeAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const input = loginSchema.parse(await req.json());
    const session = await authenticate(input);
    await createSessionCookie(session);
    await writeAudit({
      userId: session.userId,
      action: "auth.login",
      ipAddress: req.headers.get("x-forwarded-for"),
    });
    return ok({ name: session.name, role: session.role });
  } catch (err) {
    return handleApiError(err);
  }
}
