import { notFound } from "next/navigation";
import { NAV_GROUPS } from "@/config/navigation";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export default function Page() {
  const item = NAV_GROUPS.flatMap((g) => g.items).find((i) => i.href === "/lesson-plans/new");
  if (!item) notFound();
  return <ModulePlaceholder item={item} />;
}
