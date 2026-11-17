import { loginSchema } from "@/schemas/auth";
import { authenticate } from "@/server/services/auth.service";
import { createSessionCookie } from "@/lib/auth/session";
import { handleApiError, ok, readJson } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const session = await authenticate(loginSchema.parse(await readJson(req)));
    await createSessionCookie(session);
    return ok({ name: session.name });
  } catch (err) {
    return handleApiError(err);
  }
}
