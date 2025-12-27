import { randomUUID } from "crypto";
import type { FastifyInstance } from "fastify";
import { config } from "../config";
import { appendChatMessage } from "../db/chatHistory";
import { createMoodLog } from "../db/moodLogs";
import { createSessionMetadata } from "../db/sessionMetadata";
import { LlmClient } from "../llm/llmClient";
import { GeminiProvider } from "../llm/providers/gemini";
import { OpenAIProvider } from "../llm/providers/openai";
import { assessSafety } from "../safety/checkSafety";
import { verifyFirebaseToken } from "../middleware/verifyFirebaseToken";

const llmClient = config.llm.apiKey
  ? new LlmClient({
    providers: {
      openai: new OpenAIProvider({ apiKey: config.llm.apiKey, defaultModel: config.llm.model }),
      gemini: new GeminiProvider({ apiKey: config.llm.apiKey, defaultModel: config.llm.model }),
    },
  })
  : null;

const buildFallbackMeditationScript = (goal: string, mood: string) => {
  const moodLine = mood ? `Du fühlst dich ${mood}. ` : "";
  const goalLine = goal ? `Deine Intention ist ${goal}. ` : "";
  return [
    "Schließe die Augen und atme tief ein und aus.",
    moodLine + goalLine + "Lenke deine Aufmerksamkeit auf den Atem.",
    "Mit jedem Ausatmen lässt du Spannung los.",
    "Nimm die Ruhe wahr, die sich in dir ausbreitet.",
  ].join(" ");
};

const buildFallbackChatResponse = (message: string) => {
  return `Danke fürs Teilen. Möchtest du genauer beschreiben, was dich gerade beschäftigt? Du hast gesagt: \"${message}\"`;
};

const generateMeditationScript = async (
  goal: string,
  mood: string,
  uid: string,
  sessionId: string,
) => {
  if (!llmClient) {
    return buildFallbackMeditationScript(goal, mood);
  }

  const response = await llmClient.generateMeditationScript(
    {
      theme: goal || mood || "Ruhe",
      durationMinutes: 10,
      tone: "beruhigend",
      locale: "de-DE",
    },
    { userId: uid, sessionId },
  );

  return response.text.trim() || buildFallbackMeditationScript(goal, mood);
};

const generateChatResponse = async (message: string, uid: string) => {
  if (!llmClient) {
    return buildFallbackChatResponse(message);
  }

  const response = await llmClient.generateChatResponse(
    {
      message,
      locale: "de-DE",
    },
    { userId: uid },
  );

  return response.text.trim() || buildFallbackChatResponse(message);
};

export const registerV1Routes = async (app: FastifyInstance): Promise<void> => {
  app.register(async (v1) => {
    v1.addHook("preHandler", verifyFirebaseToken);

    v1.post("/sessions", async (request, reply) => {
      if (!config.featureFlags.enableSessions) {
        return reply.code(404).send({ error: "Sessions feature disabled" });
      }
      const { goal = "", mood = "" } = (request.body as { goal?: string; mood?: string }) ?? {};
      const uid = request.user?.uid ?? "anonymous";
      const sessionId = randomUUID();
      const safety = assessSafety(`${goal} ${mood}`.trim());

      if (safety.blocked) {
        return reply.send({ sessionId, safety });
      }

      const transcript = await generateMeditationScript(goal, mood, uid, sessionId);
      await createSessionMetadata(sessionId, {
        uid,
        title: goal,
        transcript,
        audioPath: config.audio.fallbackUrl ?? undefined,
      });

      return reply.send({
        sessionId,
        transcript,
        audioUrl: config.audio.fallbackUrl ?? null,
        safety,
      });
    });

    v1.post("/chat", async (request, reply) => {
      if (!config.featureFlags.enableChat) {
        return reply.code(404).send({ error: "Chat feature disabled" });
      }
      const { message = "", sessionId } = (request.body as {
        message?: string;
        sessionId?: string;
      }) ?? {};

      if (!message) {
        return reply.code(400).send({ error: "Missing message" });
      }

      const uid = request.user?.uid ?? "anonymous";
      const safety = assessSafety(message);
      if (safety.blocked) {
        await appendChatMessage(uid, randomUUID(), {
          uid,
          role: "user",
          content: message,
          sessionId,
        });
        return reply.send({ safety, reply: null });
      }

      const replyText = await generateChatResponse(message, uid);
      await appendChatMessage(uid, randomUUID(), {
        uid,
        role: "user",
        content: message,
        sessionId,
      });
      await appendChatMessage(uid, randomUUID(), {
        uid,
        role: "assistant",
        content: replyText,
        sessionId,
      });

      return reply.send({ reply: replyText, safety });
    });

    v1.post("/mood", async (request, reply) => {
      if (!config.featureFlags.enableMoodTracking) {
        return reply.code(404).send({ error: "Mood tracking feature disabled" });
      }
      const { label = "", notes = "", score, sessionId } = (request.body as {
        label?: string;
        notes?: string;
        score?: number;
        sessionId?: string;
      }) ?? {};

      if (!label) {
        return reply.code(400).send({ error: "Missing mood label" });
      }

      const uid = request.user?.uid ?? "anonymous";
      const moodId = randomUUID();

      await createMoodLog(moodId, {
        uid,
        label,
        notes,
        score,
        sessionId,
      });

      return reply.send({
        moodId,
        label,
        notes,
        score,
        createdAt: new Date().toISOString(),
      });
    });
  }, { prefix: "/v1" });
};
