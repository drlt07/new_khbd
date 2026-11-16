import { ApiError, ok, teacherRoute } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { importCommitSchema } from "@/schemas/student";
import { assertClassOwner } from "@/server/services/authz";
import { previewImport } from "@/server/services/import.service";
import { importStudents } from "@/server/services/student.service";

type P = { id: string };

/**
 * Hai bước:
 *  - multipart/form-data (file)  -> xem trước, báo lỗi theo dòng, KHÔNG ghi DB
 *  - application/json { rows }   -> ghi các dòng giáo viên đã xác nhận
 */
export const POST = teacherRoute<P>(async ({ req, session, params }) => {
  await assertClassOwner(session.teacherId, params.id);
  const type = req.headers.get("content-type") ?? "";

  if (type.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError(422, "Vui lòng chọn tệp");
    return ok(await previewImport(params.id, file));
  }

  const { rows } = importCommitSchema.parse(await req.json());
  const result = await importStudents(session.teacherId, params.id, rows);
  await writeAudit({ userId: session.userId, action: "student.import", entityType: "Class", entityId: params.id, metadata: result });
  return ok(result, { status: 201 });
});
