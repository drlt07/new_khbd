import type { ProfileStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { PROFILE_STATUS_LABEL, PROFILE_STATUS_TONE } from "@/lib/labels";

export function ProfileStatusBadge({ status }: { status: ProfileStatus }) {
  return <Badge tone={PROFILE_STATUS_TONE[status]}>{PROFILE_STATUS_LABEL[status]}</Badge>;
}
