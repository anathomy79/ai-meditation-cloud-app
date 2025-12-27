import { AbTestConfig, LlmConfig, LlmProviderName, RouterContext, TaskType } from "./types";

const normalizeWeights = (variants: AbTestConfig["variants"]) => {
  const total = variants.reduce((sum, variant) => sum + variant.weight, 0);
  return variants.map((variant) => ({
    ...variant,
    weight: total === 0 ? 0 : variant.weight / total,
  }));
};

const hashString = (input: string) => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const selectVariant = (config: AbTestConfig, context: RouterContext) => {
  const seed = context.userId || context.sessionId || "anonymous";
  const value = (hashString(seed) % 10000) / 10000;
  const normalized = normalizeWeights(config.variants);

  let cumulative = 0;
  for (const variant of normalized) {
    cumulative += variant.weight;
    if (value <= cumulative) {
      return variant;
    }
  }

  return normalized[normalized.length - 1];
};

const isProviderEnabled = (provider: LlmProviderName, config: LlmConfig) => {
  if (provider === "openai") {
    return config.featureFlags.enableOpenAI;
  }
  return config.featureFlags.enableGemini;
};

export const chooseProvider = (
  task: TaskType,
  context: RouterContext,
  config: LlmConfig,
): LlmProviderName => {
  const abTest = config.abTests[task];
  if (abTest?.enabled) {
    const variant = selectVariant(abTest, context);
    if (isProviderEnabled(variant.provider, config)) {
      return variant.provider;
    }
  }

  const fallback = config.routing[task];
  if (isProviderEnabled(fallback, config)) {
    return fallback;
  }

  if (config.featureFlags.enableOpenAI) {
    return "openai";
  }
  return "gemini";
};
