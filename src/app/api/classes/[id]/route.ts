import { ok, readJson, teacherRoute } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { classUpdateSchema } from "@/schemas/class";
import { deleteClass, getClassDetail, updateClass } from "@/server/services/class.service";

type P = { id: string };

export const GET = teacherRoute<P>(async ({ session, params }) => ok(await getClassDetail(session.teacherId, params.id)));

export const PATCH = teacherRoute<P>(async ({ req, session, params }) => {
  const input = classUpdateSchema.parse(await readJson(req));
  const cls = await updateClass(session.teacherId, params.id, input);
  const action = input.isArchived === true ? "class.archive" : input.isArchived === false ? "class.restore" : "class.update";
  await writeAudit({ userId: session.userId, action, entityType: "Class", entityId: cls.id, metadata: { fields: Object.keys(input) } });
  return ok(cls);
});

export const DELETE = teacherRoute<P>(async ({ session, params }) => {
  const cls = await deleteClass(session.teacherId, params.id);
  await writeAudit({ userId: session.userId, action: "class.delete", entityType: "Class", entityId: cls.id, metadata: { name: cls.name } });
  return ok({ success: true });
});
