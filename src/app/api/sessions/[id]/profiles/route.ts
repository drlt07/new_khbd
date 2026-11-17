import { ok, userRoute } from "@/lib/api";
import { assertSessionOwner, refreshProfiles } from "@/server/services/session.service";

/** Tổng hợp lại hồ sơ nhóm từ thành viên đã lưu */
export const POST = userRoute<{ id: string }>(async ({ session, params }) => {
  await assertSessionOwner(session.userId, params.id);
  await refreshProfiles(params.id);
  return ok({ success: true });
});
