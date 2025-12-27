const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const optionalEnv = (key: string, fallback = ""): string => {
  return process.env[key] ?? fallback;
};

const booleanEnv = (key: string, fallback = false): boolean => {
  const raw = process.env[key];
  if (raw === undefined) {
    return fallback;
  }
  return raw.toLowerCase() === "true" || raw === "1";
};

const numberEnv = (key: string, fallback: number): number => {
  const raw = process.env[key];
  if (raw === undefined) {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  server: {
    host: optionalEnv("HOST", "0.0.0.0"),
    port: Number(optionalEnv("PORT", "8080"))
  },
  llm: {
    provider: optionalEnv("LLM_PROVIDER", "openai"),
    apiKey: optionalEnv("LLM_API_KEY"),
    model: optionalEnv("LLM_MODEL", "gpt-4o-mini")
  },
  tts: {
    provider: optionalEnv("TTS_PROVIDER", "google"),
    apiKey: optionalEnv("TTS_API_KEY"),
    voice: optionalEnv("TTS_VOICE", ""),
    language: optionalEnv("TTS_LANGUAGE", "de-DE"),
    speakingRate: numberEnv("TTS_SPEAKING_RATE", 1.0)
  },
  firebase: {
    projectId: optionalEnv("FIREBASE_PROJECT_ID"),
    serviceAccountJson: optionalEnv("FIREBASE_SERVICE_ACCOUNT_JSON")
  },
  featureFlags: {
    enableChat: booleanEnv("FEATURE_CHAT", true),
    enableMoodTracking: booleanEnv("FEATURE_MOOD_TRACKING", true),
    enableSessions: booleanEnv("FEATURE_SESSIONS", true)
  },
  requireEnv
};

export type AppConfig = typeof config;
