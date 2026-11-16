import { clearSessionCookie, getSession } from "@/lib/auth/session";
import { handleApiError, ok } from "@/lib/api";
import { writeAudit } from "@/lib/audit";

export async function POST() {
  try {
    const session = await getSession();
    await clearSessionCookie();
    if (session) await writeAudit({ userId: session.userId, action: "auth.logout" });
    return ok({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
