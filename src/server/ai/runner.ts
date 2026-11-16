import "server-only";
import type { z } from "zod";
import { getAIConfig } from "./config";
import { mockProvider } from "./providers/mock.provider";
import { openAIProvider } from "./providers/openai.provider";
import type { AIRunResult, AITaskDefinition } from "./types";

/**
 * Chạy một tác vụ AI: validate đầu vào -> dựng prompt -> gọi provider -> validate đầu ra.
 * Việc lưu AIAnalysis / AIRecommendation do service nghiệp vụ đảm nhận để truy vết.
 */
export async function runAITask<I extends z.ZodTypeAny, O extends z.ZodTypeAny>(
  task: AITaskDefinition<I, O>,
  rawInput: unknown,
): Promise<AIRunResult<z.infer<O>>> {
  const config = getAIConfig();
  const input = task.inputSchema.parse(rawInput);

  if (config.isMock) {
    const output = task.outputSchema.parse(task.mock(input));
    return { output, provider: mockProvider.name, model: null, isMock: true, promptVersion: task.promptVersion };
  }

  const { system, user } = task.buildPrompt(input);
  const raw = await openAIProvider.completeJSON({ system, user, model: config.model });
  const output = task.outputSchema.parse(raw);
  return { output, provider: openAIProvider.name, model: config.model, isMock: false, promptVersion: task.promptVersion };
}
