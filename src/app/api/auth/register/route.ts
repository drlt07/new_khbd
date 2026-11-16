import { NextRequest } from "next/server";
import { registerSchema } from "@/schemas/auth";
import { registerTeacher } from "@/server/services/auth.service";
import { createSessionCookie } from "@/lib/auth/session";
import { handleApiError, ok } from "@/lib/api";
import { writeAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const input = registerSchema.parse(await req.json());
    const session = await registerTeacher(input);
    await createSessionCookie(session);
    await writeAudit({ userId: session.userId, action: "auth.register", entityType: "User", entityId: session.userId });
    return ok({ name: session.name }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
