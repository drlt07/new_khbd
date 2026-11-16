import "server-only";
import type { AIProvider } from "../types";

/** Gọi OpenAI Chat Completions ở chế độ JSON. Chỉ chạy ở server. */
export const openAIProvider: AIProvider = {
  name: "openai",
  isMock: false,
  async completeJSON({ system, user, model }) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
    const json = await res.json();
    return JSON.parse(json.choices?.[0]?.message?.content ?? "{}");
  },
};
