import "server-only";

export const CLAUDE_MODEL = "claude-opus-5-5";

export type EngineInfo = { kind: "claude" | "rules"; label: string; detail: string };

/** Claude được dùng khi máy chủ có ANTHROPIC_API_KEY; ngược lại dùng bộ máy quy tắc (ghi rõ trên giao diện). */
export function getEngine(): EngineInfo {
  if (process.env.ANTHROPIC_API_KEY)
    return { kind: "claude", label: "Claude AI", detail: `Mô hình ${CLAUDE_MODEL}; dữ liệu học sinh được ẩn danh trước khi gửi` };
  return { kind: "rules", label: "Bộ máy quy tắc", detail: "Chưa cấu hình ANTHROPIC_API_KEY — dùng quy tắc có kiểm thử, không gọi AI" };
}

export const RULES_ENGINE = "rules-v1";
export const claudeEngineId = () => `claude:${CLAUDE_MODEL}`;

export function engineLabel(id: string | null | undefined) {
  if (!id) return "—";
  if (id.startsWith("claude:")) return "Claude AI";
  if (id.startsWith("rules")) return id.includes("fallback") ? "Quy tắc (AI lỗi, đã dự phòng)" : "Bộ máy quy tắc";
  return id;
}
