export type TaskType = "meditationScript" | "chatResponse" | "safetyAnalysis";

export type LlmProviderName = "openai" | "gemini";

export interface LlmRequest {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LlmResponse {
  text: string;
  raw: unknown;
  provider: LlmProviderName;
  model: string;
}

export interface LlmProvider {
  name: LlmProviderName;
  generateText(request: LlmRequest, options?: ProviderRequestOptions): Promise<LlmResponse>;
}

export interface ProviderRequestOptions {
  model?: string;
  metadata?: Record<string, string | number | boolean | undefined>;
}

export interface FeatureFlags {
  enableOpenAI: boolean;
  enableGemini: boolean;
}

export interface RoutingDefaults {
  meditationScript: LlmProviderName;
  chatResponse: LlmProviderName;
  safetyAnalysis: LlmProviderName;
}

export interface AbTestVariant {
  name: string;
  provider: LlmProviderName;
  weight: number;
}

export interface AbTestConfig {
  enabled: boolean;
  variants: AbTestVariant[];
}

export interface AbTests {
  meditationScript?: AbTestConfig;
  chatResponse?: AbTestConfig;
  safetyAnalysis?: AbTestConfig;
}

export interface LlmConfig {
  featureFlags: FeatureFlags;
  routing: RoutingDefaults;
  abTests: AbTests;
}

export interface RouterContext {
  userId?: string;
  sessionId?: string;
  locale?: string;
}

export interface MeditationScriptInput {
  theme: string;
  durationMinutes: number;
  tone?: string;
  locale?: string;
}

export interface ChatResponseInput {
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  locale?: string;
}

export interface SafetyAnalysisInput {
  content: string;
  locale?: string;
}
