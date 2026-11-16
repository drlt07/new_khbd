import type { z } from "zod";
import type { AITaskType } from "@prisma/client";

/** Một tác vụ AI độc lập, có đầu vào/đầu ra được kiểm tra bằng schema. */
export interface AITaskDefinition<I extends z.ZodTypeAny, O extends z.ZodTypeAny> {
  type: AITaskType;
  promptVersion: string;
  inputSchema: I;
  outputSchema: O;
  /** Prompt hệ thống & người dùng được dựng tập trung tại src/server/ai/prompts */
  buildPrompt: (input: z.infer<I>) => { system: string; user: string };
  /** Kết quả mô phỏng khi chạy provider "mock" — phải tôn trọng nguyên tắc "không bịa dữ liệu". */
  mock: (input: z.infer<I>) => z.infer<O>;
}

export interface AIProvider {
  name: string;
  isMock: boolean;
  /** Trả về JSON thô; lớp runner chịu trách nhiệm validate theo outputSchema. */
  completeJSON(args: { system: string; user: string; model: string }): Promise<unknown>;
}

export type AIRunResult<O> = {
  output: O;
  provider: string;
  model: string | null;
  isMock: boolean;
  promptVersion: string;
};
