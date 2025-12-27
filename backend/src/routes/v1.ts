import type { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { config } from "../config";
import { createMoodLog } from "../db/moodLogs";
import { createSessionMetadata } from "../db/sessionMetadata";
import { LlmClient } from "../llm/llmClient";
import { GeminiProvider } from "../llm/providers/gemini";
import { OpenAIProvider } from "../llm/providers/openai";
import { verifyFirebaseToken } from "../middleware/verifyFirebaseToken";
import { getSignedAudioUrl, uploadAudioBuffer } from "../storage/audioStorage";
import { GoogleTtsClient } from "../tts/googleTts";

interface CreateSessionRequestBody {
  theme: string;
  durationMinutes: number;
  tone?: string;
  locale?: string;
  title?: string;
  moodId?: string;
  languageCode?: string;
  voiceName?: string;
  speakingRate?: number;
}

interface ChatRequestBody {
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  locale?: string;
}

interface MoodRequestBody {
  label: string;
  score?: number;
  notes?: string;
  sessionId?: string;
}

interface SafetyVerdict {
  verdict: "SAFE" | "UNSAFE";
  reasons: string[];
  confidence: number;
}

const parseSafetyVerdict = (rawText: string): SafetyVerdict => {
  const text = rawText.trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    return {
      verdict: "UNSAFE",
      reasons: ["Missing safety verdict payload."],
      confidence: 0,
    };
  }

  try {
    const parsed = JSON.parse(match[0]) as Partial<SafetyVerdict>;
    const verdict = parsed.verdict === "UNSAFE" ? "UNSAFE" : "SAFE";
    const reasons = Array.isArray(parsed.reasons)
      ? parsed.reasons.filter((reason) => typeof reason === "string")
      : [];
    const confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0;

    return {
      verdict,
      reasons,
      confidence,
    };
  } catch {
    return {
      verdict: "UNSAFE",
      reasons: ["Invalid safety verdict payload."],
      confidence: 0,
    };
  }
};

const createLlmClient = (): LlmClient => {
  if (!config.llm.apiKey) {
    throw new Error("Missing LLM API key configuration");
  }

  return new LlmClient({
    providers: {
      openai: new OpenAIProvider({
        apiKey: config.llm.apiKey,
        defaultModel: config.llm.model,
      }),
      gemini: new GeminiProvider({
        apiKey: config.llm.apiKey,
        defaultModel: config.llm.model,
      }),
    },
  });
};

const runSafetyCheck = async (
  llmClient: LlmClient,
  content: string,
  locale?: string,
): Promise<SafetyVerdict> => {
  const analysis = await llmClient.analyzeSafety({ content, locale });
  return parseSafetyVerdict(analysis.text);
};

export const registerV1Routes = async (app: FastifyInstance): Promise<void> => {
  app.register(async (v1) => {
    v1.addHook("preHandler", verifyFirebaseToken);

    v1.post("/sessions", async (request, reply) => {
      if (!config.featureFlags.enableSessions) {
        return reply.code(404).send({ error: "Sessions feature disabled" });
      }
      if (!request.user?.uid) {
        return reply.code(401).send({ error: "Unauthorized" });
      }

      const payload = request.body as CreateSessionRequestBody;
      if (!payload?.theme || !payload?.durationMinutes) {
        return reply.code(400).send({ error: "Missing theme or durationMinutes" });
      }

      let llmClient: LlmClient;
      try {
        llmClient = createLlmClient();
      } catch (error) {
        request.log.error({ error }, "Failed to create LLM client");
        return reply.code(500).send({ error: "Missing LLM API key configuration" });
      }

      if (config.tts.provider !== "google") {
        return reply.code(500).send({ error: "Unsupported TTS provider configured" });
      }

      if (payload.durationMinutes <= 0) {
        return reply.code(400).send({ error: "durationMinutes must be greater than zero" });
      }

      if (
        payload.speakingRate !== undefined
        && (!Number.isFinite(payload.speakingRate) || payload.speakingRate <= 0)
      ) {
        return reply.code(400).send({ error: "speakingRate must be a positive number" });
      }

      const safetyRequestVerdict = await runSafetyCheck(
        llmClient,
        `Meditation request: ${payload.theme}`,
        payload.locale ?? payload.languageCode,
      );
      if (safetyRequestVerdict.verdict === "UNSAFE") {
        return reply.code(422).send({
          error: "Request failed safety check",
          reasons: safetyRequestVerdict.reasons,
        });
      }

      const sessionId = randomUUID();
      const transcriptResponse = await llmClient.generateMeditationScript({
        theme: payload.theme,
        durationMinutes: payload.durationMinutes,
        tone: payload.tone,
        locale: payload.locale ?? payload.languageCode,
      });

      const transcript = transcriptResponse.text.trim();
      if (!transcript) {
        return reply.code(500).send({ error: "LLM returned empty transcript" });
      }

      const safetyTranscriptVerdict = await runSafetyCheck(
        llmClient,
        transcript,
        payload.locale ?? payload.languageCode,
      );
      if (safetyTranscriptVerdict.verdict === "UNSAFE") {
        return reply.code(500).send({
          error: "Generated transcript failed safety check",
        });
      }

      const ttsClient = new GoogleTtsClient();
      const audioBuffer = await ttsClient.synthesizeSpeech(transcript, {
        languageCode: payload.languageCode,
        voiceName: payload.voiceName,
        speakingRate: payload.speakingRate,
      });

      const storagePath = `sessions/${sessionId}/meditation.mp3`;
      const uploadResult = await uploadAudioBuffer(storagePath, audioBuffer, {
        contentType: "audio/mpeg",
      });
      const audioUrl = await getSignedAudioUrl(uploadResult.storagePath);

      await createSessionMetadata(sessionId, {
        uid: request.user.uid,
        title: payload.title ?? payload.theme,
        moodId: payload.moodId,
        model: transcriptResponse.model,
        transcript,
        audioPath: uploadResult.storagePath,
        audioUrl,
      });

      return reply.code(201).send({
        sessionId,
        transcript,
        audioUrl,
        storagePath: uploadResult.storagePath,
      });
    });

    v1.post("/chat", async (request, reply) => {
      if (!config.featureFlags.enableChat) {
        return reply.code(404).send({ error: "Chat feature disabled" });
      }
      if (!request.user?.uid) {
        return reply.code(401).send({ error: "Unauthorized" });
      }

      const payload = request.body as ChatRequestBody;
      if (!payload?.message) {
        return reply.code(400).send({ error: "Missing message" });
      }

      let llmClient: LlmClient;
      try {
        llmClient = createLlmClient();
      } catch (error) {
        request.log.error({ error }, "Failed to create LLM client");
        return reply.code(500).send({ error: "Missing LLM API key configuration" });
      }

      const safetyRequestVerdict = await runSafetyCheck(
        llmClient,
        payload.message,
        payload.locale,
      );
      if (safetyRequestVerdict.verdict === "UNSAFE") {
        return reply.code(422).send({
          error: "Request failed safety check",
          reasons: safetyRequestVerdict.reasons,
        });
      }

      const response = await llmClient.generateChatResponse({
        message: payload.message,
        history: payload.history,
        locale: payload.locale,
      }, {
        userId: request.user.uid,
      });

      const message = response.text.trim();
      if (!message) {
        return reply.code(500).send({ error: "LLM returned empty response" });
      }

      const safetyResponseVerdict = await runSafetyCheck(
        llmClient,
        message,
        payload.locale,
      );
      if (safetyResponseVerdict.verdict === "UNSAFE") {
        return reply.code(500).send({
          error: "Generated response failed safety check",
        });
      }

      return reply.code(200).send({
        message,
        model: response.model,
        provider: response.provider,
      });
    });

    v1.post("/mood", async (request, reply) => {
      if (!config.featureFlags.enableMoodTracking) {
        return reply.code(404).send({ error: "Mood tracking feature disabled" });
      }
      if (!request.user?.uid) {
        return reply.code(401).send({ error: "Unauthorized" });
      }

      const payload = request.body as MoodRequestBody;
      if (!payload?.label) {
        return reply.code(400).send({ error: "Missing label" });
      }
      if (payload.score !== undefined && !Number.isFinite(payload.score)) {
        return reply.code(400).send({ error: "score must be a number" });
      }

      const moodId = randomUUID();
      await createMoodLog(moodId, {
        uid: request.user.uid,
        label: payload.label,
        score: payload.score,
        notes: payload.notes,
        sessionId: payload.sessionId,
      });

      return reply.code(201).send({
        moodId,
        label: payload.label,
        score: payload.score,
        notes: payload.notes,
        sessionId: payload.sessionId,
      });
    });
  }, { prefix: "/v1" });
};
