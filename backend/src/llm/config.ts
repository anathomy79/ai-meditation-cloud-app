import { LlmConfig } from "./types";

const truthy = (value: string | undefined) => value === "1" || value === "true";

export const defaultConfig: LlmConfig = {
  featureFlags: {
    enableOpenAI: true,
    enableGemini: true,
  },
  routing: {
    meditationScript: "openai",
    chatResponse: "openai",
    safetyAnalysis: "openai",
  },
  abTests: {
    meditationScript: {
      enabled: false,
      variants: [
        { name: "control", provider: "openai", weight: 0.5 },
        { name: "gemini", provider: "gemini", weight: 0.5 },
      ],
    },
  },
};

export const loadConfig = (overrides?: Partial<LlmConfig>): LlmConfig => {
  const envConfig: Partial<LlmConfig> = {
    featureFlags: {
      enableOpenAI: truthy(process.env.LLM_ENABLE_OPENAI) || defaultConfig.featureFlags.enableOpenAI,
      enableGemini: truthy(process.env.LLM_ENABLE_GEMINI) || defaultConfig.featureFlags.enableGemini,
    },
    routing: {
      meditationScript: (process.env.LLM_DEFAULT_MEDITATION_PROVIDER as "openai" | "gemini")
        || defaultConfig.routing.meditationScript,
      chatResponse: (process.env.LLM_DEFAULT_CHAT_PROVIDER as "openai" | "gemini")
        || defaultConfig.routing.chatResponse,
      safetyAnalysis: (process.env.LLM_DEFAULT_SAFETY_PROVIDER as "openai" | "gemini")
        || defaultConfig.routing.safetyAnalysis,
    },
  };

  return {
    ...defaultConfig,
    ...envConfig,
    ...overrides,
    featureFlags: {
      ...defaultConfig.featureFlags,
      ...envConfig.featureFlags,
      ...overrides?.featureFlags,
    },
    routing: {
      ...defaultConfig.routing,
      ...envConfig.routing,
      ...overrides?.routing,
    },
    abTests: {
      ...defaultConfig.abTests,
      ...overrides?.abTests,
    },
  };
};
