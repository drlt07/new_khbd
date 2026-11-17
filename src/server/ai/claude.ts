import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod/v4";
import { CLAUDE_MODEL } from "./engine";

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 2 }));

export class AIError extends Error {
  name = "AIError";
}

const SYSTEM_BASE = `Bạn là trợ lý chuyên môn giúp giáo viên Việt Nam dạy học phân hóa theo chương trình GDPT 2018 (Công văn 5512).
Nguyên tắc bắt buộc:
- Chỉ dựa trên dữ liệu được cung cấp; không bịa thông tin về học sinh. Thiếu dữ liệu thì nói rõ.
- Học sinh được ẩn danh bằng mã (HS01…); không đoán danh tính.
- Mọi nhóm hướng tới cùng yêu cầu cần đạt; khác nhau ở cách tiếp cận, mức thử thách và mức hỗ trợ — không hạ thấp mục tiêu của học sinh gặp khó khăn.
- Giáo viên là người quyết định cuối cùng; viết ngắn gọn, cụ thể, bằng tiếng Việt.`;

/** Gọi Claude với đầu ra có cấu trúc (kiểm tra bằng Zod). Bật fallback phía server khi mô hình từ chối. */
export async function structured<T extends z.ZodType>(schema: T, task: string, input: unknown, effort: "low" | "medium" | "high" = "medium"): Promise<z.infer<T>> {
  try {
    const res = await getClient().beta.messages.parse({
      model: CLAUDE_MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort, format: betaZodOutputFormat(schema) },
      system: SYSTEM_BASE,
      messages: [{ role: "user", content: `${task}\n\nDữ liệu (JSON):\n${JSON.stringify(input)}` }],
    });
    if (res.stop_reason === "refusal") throw new AIError("Mô hình từ chối yêu cầu");
    if (res.stop_reason === "max_tokens") throw new AIError("Kết quả quá dài, bị cắt");
    if (!res.parsed_output) throw new AIError("Kết quả không đúng cấu trúc");
    return res.parsed_output as z.infer<T>;
  } catch (e) {
    if (e instanceof AIError) throw e;
    if (e instanceof Anthropic.AuthenticationError) throw new AIError("API key không hợp lệ");
    if (e instanceof Anthropic.RateLimitError) throw new AIError("Vượt giới hạn tần suất gọi AI");
    if (e instanceof Anthropic.APIError) throw new AIError(`Lỗi AI ${e.status}`);
    throw new AIError("Không kết nối được dịch vụ AI");
  }
}
