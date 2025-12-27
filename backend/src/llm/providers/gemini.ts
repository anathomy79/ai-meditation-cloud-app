import { LlmProvider, LlmRequest, LlmResponse, ProviderRequestOptions } from "../types";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

export class GeminiProvider implements LlmProvider {
  name = "gemini" as const;
  private apiKey: string;
  private defaultModel: string;

  constructor({ apiKey, defaultModel }: { apiKey: string; defaultModel?: string }) {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel ?? "gemini-1.5-flash";
  }

  async generateText(request: LlmRequest, options?: ProviderRequestOptions): Promise<LlmResponse> {
    const model = options?.model ?? this.defaultModel;
    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: request.prompt }],
        },
      ],
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? 800,
      },
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    return {
      text,
      raw: data,
      provider: this.name,
      model,
    };
  }
}
