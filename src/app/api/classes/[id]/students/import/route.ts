import { ApiError, ok, userRoute } from "@/lib/api";
import { importCommitSchema } from "@/schemas/student";
import { assertClassOwner } from "@/server/services/authz";
import { previewImport } from "@/server/services/import.service";
import { importStudents } from "@/server/services/student.service";

/** multipart (file) -> xem trước, không ghi DB; JSON { rows } -> ghi các dòng đã xác nhận */
export const POST = userRoute<{ id: string }>(async ({ req, session, params }) => {
  await assertClassOwner(session.userId, params.id);
  if ((req.headers.get("content-type") ?? "").includes("multipart/form-data")) {
    const file = (await req.formData()).get("file");
    if (!(file instanceof File)) throw new ApiError(422, "Vui lòng chọn tệp");
    return ok(await previewImport(params.id, file));
  }
  const { rows } = importCommitSchema.parse(await req.json());
  return ok(await importStudents(session.userId, params.id, rows), { status: 201 });
});
