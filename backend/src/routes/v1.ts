import type { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { config } from "../config";
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
      if (!config.llm.apiKey) {
        return reply.code(500).send({ error: "Missing LLM API key configuration" });
      }

      const llmClient = new LlmClient({
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

    v1.post("/chat", async (_request, reply) => {
      if (!config.featureFlags.enableChat) {
        return reply.code(404).send({ error: "Chat feature disabled" });
      }
      return reply.code(501).send({ message: "Not implemented" });
    });

    v1.post("/mood", async (_request, reply) => {
      if (!config.featureFlags.enableMoodTracking) {
        return reply.code(404).send({ error: "Mood tracking feature disabled" });
      }
      return reply.code(501).send({ message: "Not implemented" });
    });
  }, { prefix: "/v1" });
};
