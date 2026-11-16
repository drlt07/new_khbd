import "server-only";

export type AIProviderName = "mock" | "openai";

/** Cấu hình AI chỉ đọc ở server — API key không bao giờ được gửi xuống client. */
export function getAIConfig() {
  const requested = (process.env.AI_PROVIDER ?? "mock") as AIProviderName;
  const hasKey = Boolean(process.env.OPENAI_API_KEY);
  // Nếu yêu cầu openai mà thiếu key -> rơi về mock và đánh dấu rõ.
  const provider: AIProviderName = requested === "openai" && hasKey ? "openai" : "mock";
  return {
    provider,
    isMock: provider === "mock",
    model: process.env.AI_MODEL ?? "gpt-4o-mini",
    misconfigured: requested === "openai" && !hasKey,
  };
}
