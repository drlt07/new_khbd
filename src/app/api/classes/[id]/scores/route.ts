import { ApiError, ok, userRoute } from "@/lib/api";
import { scoreCommitSchema } from "@/schemas/score";
import { commitScores, listScoreSheets, previewScores } from "@/server/services/score.service";

type P = { id: string };

export const GET = userRoute<P>(async ({ session, params }) => ok(await listScoreSheets(session.userId, params.id)));

/** multipart: file + mode ("preview" | "commit") + options (JSON, khi commit) */
export const POST = userRoute<P>(async ({ req, session, params }) => {
  const form = await req.formData().catch(() => { throw new ApiError(400, "Yêu cầu phải là multipart/form-data"); });
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) throw new ApiError(422, "Chọn tệp bảng điểm (.xlsx hoặc .csv)");
  if (form.get("mode") === "commit") {
    let raw: unknown;
    try { raw = JSON.parse(String(form.get("options") ?? "{}")); } catch { throw new ApiError(400, "Tùy chọn không hợp lệ"); }
    return ok(await commitScores(session.userId, params.id, file, scoreCommitSchema.parse(raw)), { status: 201 });
  }
  return ok(await previewScores(session.userId, params.id, file));
});
