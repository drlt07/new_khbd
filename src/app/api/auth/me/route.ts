import { handleApiError, ok, requireApiSession } from "@/lib/api";

export async function GET() {
  try {
    const session = await requireApiSession();
    return ok(session);
  } catch (err) {
    return handleApiError(err);
  }
}
