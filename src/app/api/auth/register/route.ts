import { registerSchema } from "@/schemas/auth";
import { registerUser } from "@/server/services/auth.service";
import { createSessionCookie } from "@/lib/auth/session";
import { handleApiError, ok, readJson } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const session = await registerUser(registerSchema.parse(await readJson(req)));
    await createSessionCookie(session);
    return ok({ name: session.name }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
