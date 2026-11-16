import { ok, readJson, teacherRoute } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { classFilterSchema, classInputSchema } from "@/schemas/class";
import { createClass, listClasses } from "@/server/services/class.service";

export const GET = teacherRoute(async ({ req, session }) => {
  const filter = classFilterSchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  return ok(await listClasses(session.teacherId, filter));
});

export const POST = teacherRoute(async ({ req, session }) => {
  const input = classInputSchema.parse(await readJson(req));
  const cls = await createClass(session.teacherId, input);
  await writeAudit({ userId: session.userId, action: "class.create", entityType: "Class", entityId: cls.id, metadata: { name: cls.name } });
  return ok(cls, { status: 201 });
});
