"use client";
import type { ProfileStatus } from "@prisma/client";
import { Select } from "@/components/ui/select";
import { useMutation } from "@/hooks/use-mutation";
import { PROFILE_STATUS_LABEL } from "@/lib/labels";

/** "Đang phân tích" do hệ thống đặt khi chạy AI — giáo viên không chọn thủ công. */
const MANUAL: ProfileStatus[] = ["NOT_ANALYZED", "PENDING_REVIEW", "CONFIRMED", "NEEDS_MORE_DATA"];

export function ProfileStatusControl({ studentId, status }: { studentId: string; status: ProfileStatus }) {
  const { mutate, pending, error } = useMutation();
  return (
    <div className="space-y-1">
      <Select
        aria-label="Trạng thái hồ sơ"
        value={status}
        disabled={pending || status === "ANALYZING"}
        onChange={(e) => mutate(`/api/students/${studentId}/profile`, "PATCH", { profileStatus: e.target.value })}
        className="min-w-56"
      >
        {(status === "ANALYZING" ? (["ANALYZING"] as ProfileStatus[]) : MANUAL).map((s) => (
          <option key={s} value={s}>Hồ sơ: {PROFILE_STATUS_LABEL[s]}</option>
        ))}
      </Select>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
