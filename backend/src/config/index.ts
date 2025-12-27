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

export const config = {
  gcp: {
    projectId: optionalEnv("GCP_PROJECT_ID", optionalEnv("GOOGLE_CLOUD_PROJECT")),
  },
  server: {
    host: optionalEnv("HOST", "0.0.0.0"),
    port: Number(optionalEnv("PORT", "8080"))
  },
  service: {
    name: optionalEnv("SERVICE_NAME", optionalEnv("K_SERVICE", "ai-meditation-backend")),
    version: optionalEnv("SERVICE_VERSION", optionalEnv("K_REVISION", "local")),
  },
  llm: {
    provider: optionalEnv("LLM_PROVIDER", "openai"),
    apiKey: optionalEnv("LLM_API_KEY"),
    model: optionalEnv("LLM_MODEL", "gpt-4o-mini")
  },
  tts: {
    provider: optionalEnv("TTS_PROVIDER", "elevenlabs"),
    apiKey: optionalEnv("TTS_API_KEY"),
    voice: optionalEnv("TTS_VOICE", "default")
  },
  firebase: {
    projectId: optionalEnv("FIREBASE_PROJECT_ID"),
    serviceAccountJson: optionalEnv("FIREBASE_SERVICE_ACCOUNT_JSON"),
    serviceAccountSecret: optionalEnv("FIREBASE_SERVICE_ACCOUNT_SECRET"),
    storageBucket: optionalEnv("FIREBASE_STORAGE_BUCKET"),
  },
  secrets: {
    llmApiKeySecret: optionalEnv("LLM_API_KEY_SECRET"),
    ttsApiKeySecret: optionalEnv("TTS_API_KEY_SECRET"),
  },
  observability: {
    enableCloudLogging: booleanEnv("ENABLE_CLOUD_LOGGING", true),
    enableErrorReporting: booleanEnv("ENABLE_ERROR_REPORTING", true),
  },
  featureFlags: {
    enableChat: booleanEnv("FEATURE_CHAT", true),
    enableMoodTracking: booleanEnv("FEATURE_MOOD_TRACKING", true),
    enableSessions: booleanEnv("FEATURE_SESSIONS", true)
  },
  requireEnv
};

export type AppConfig = typeof config;
