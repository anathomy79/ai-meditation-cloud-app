import { LlmProvider, LlmResponse, LlmRequest, ProviderRequestOptions } from "../types";

interface OpenAIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface OpenAIChatResponse {
  choices: Array<{
    message: { content: string };
  }>;
}

export class OpenAIProvider implements LlmProvider {
  name = "openai" as const;
  private apiKey: string;
  private defaultModel: string;

  constructor({ apiKey, defaultModel }: { apiKey: string; defaultModel?: string }) {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel ?? "gpt-4o-mini";
  }

  async generateText(request: LlmRequest, options?: ProviderRequestOptions): Promise<LlmResponse> {
    const model = options?.model ?? this.defaultModel;
    const payload = {
      model,
      messages: [{ role: "user", content: request.prompt } satisfies OpenAIMessage],
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 800,
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as OpenAIChatResponse;
    const text = data.choices?.[0]?.message?.content ?? "";

    return {
      text,
      raw: data,
      provider: this.name,
      model,
    };
  }
}
