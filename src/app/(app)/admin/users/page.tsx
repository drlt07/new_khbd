import { notFound } from "next/navigation";
import { NAV_GROUPS } from "@/config/navigation";
import { requireSession } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export default async function Page() {
  await requireSession(["ADMIN", "SCHOOL_MANAGER"]);
  const item = NAV_GROUPS.flatMap((g) => g.items).find((i) => i.href === "/admin/users");
  if (!item) notFound();
  return <ModulePlaceholder item={item} />;
}
