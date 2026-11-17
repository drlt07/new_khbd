import type { DataSource, EvidenceType, ProcessingStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { EVIDENCE_TYPE_LABEL } from "@/lib/labels";

export const PROCESSING_LABEL: Record<ProcessingStatus, string> = {
  UPLOADED: "Đã tải lên", EXTRACTING: "Đang trích xuất", EXTRACTED: "Đã trích xuất", FAILED: "Lỗi trích xuất",
};
const PROCESSING_TONE = { UPLOADED: "neutral", EXTRACTING: "info", EXTRACTED: "success", FAILED: "danger" } as const;

export const SOURCE_LABEL: Record<DataSource, string> = {
  MANUAL_ENTRY: "Nhập trực tiếp", FREE_TEXT_NOTE: "Văn bản tự do", FILE_UPLOAD: "Tải tệp", EXCEL_IMPORT: "Nhập Excel", OBSERVATION: "Quan sát",
};

export function ProcessingBadge({ status }: { status: ProcessingStatus }) {
  return <Badge tone={PROCESSING_TONE[status]}>{PROCESSING_LABEL[status]}</Badge>;
}
export function EvidenceTypeBadge({ type }: { type: EvidenceType }) {
  return <Badge tone="primary">{EVIDENCE_TYPE_LABEL[type]}</Badge>;
}

export function formatBytes(n: number | null | undefined) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
