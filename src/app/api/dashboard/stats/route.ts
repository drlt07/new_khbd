import { ApiError, handleApiError, ok, requireApiSession } from "@/lib/api";
import { getDashboardStats } from "@/server/services/dashboard.service";

export async function GET() {
  try {
    const session = await requireApiSession();
    if (!session.teacherId) throw new ApiError(403, "Tài khoản chưa có hồ sơ giáo viên");
    return ok(await getDashboardStats(session.teacherId));
  } catch (err) {
    return handleApiError(err);
  }
}
