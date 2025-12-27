import type { FastifyInstance } from "fastify";
import { config } from "../config";
import { verifyFirebaseToken } from "../middleware/verifyFirebaseToken";
import { runInputPrecheck, runOutputFilter } from "../safety";
import { buildDisclaimer } from "../safety/responses";

interface SessionRequestBody {
  theme: string;
  durationMinutes: number;
  tone?: string;
  locale?: string;
}

interface ChatRequestBody {
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  locale?: string;
}

export const registerV1Routes = async (app: FastifyInstance): Promise<void> => {
  app.register(async (v1) => {
    v1.addHook("preHandler", verifyFirebaseToken);

    v1.post("/sessions", async (request, reply) => {
      if (!config.featureFlags.enableSessions) {
        return reply.code(404).send({ error: "Sessions feature disabled" });
      }
      const body = request.body as SessionRequestBody;
      if (!body?.theme || !body.durationMinutes) {
        return reply.code(400).send({ error: "Missing required fields: theme, durationMinutes" });
      }

      const precheck = runInputPrecheck(`${body.theme} ${body.tone ?? ""}`.trim(), body.locale);
      if (precheck.status === "block" && precheck.response) {
        return reply.code(200).send({
          ...precheck.response,
          safety: { status: "blocked", category: precheck.category, matches: precheck.matches },
        });
      }

      const transcript = [
        `Geführte Meditation zum Thema \"${body.theme}\" für ${body.durationMinutes} Minuten.`,
        body.tone ? `Ton: ${body.tone}.` : "Ton: ruhig und unterstützend.",
        "Finde eine bequeme Position, atme tief ein und aus.",
        "Lenke deine Aufmerksamkeit sanft auf den Atem.",
        "Wenn Gedanken auftauchen, nimm sie wahr und kehre freundlich zum Atem zurück.",
        "Beende die Meditation langsam und öffne die Augen, wenn du bereit bist.",
      ].join(" ");

      const outputCheck = runOutputFilter(transcript, body.locale);
      if (outputCheck.status === "block" && outputCheck.response) {
        return reply.code(200).send({
          ...outputCheck.response,
          safety: { status: "blocked", category: outputCheck.category, matches: outputCheck.matches },
        });
      }

      return reply.code(200).send({
        transcript,
        disclaimer: buildDisclaimer(body.locale),
        safety: { status: "ok", category: "none" },
      });
    });

    v1.post("/chat", async (request, reply) => {
      if (!config.featureFlags.enableChat) {
        return reply.code(404).send({ error: "Chat feature disabled" });
      }
      const body = request.body as ChatRequestBody;
      if (!body?.message) {
        return reply.code(400).send({ error: "Missing required field: message" });
      }

      const precheck = runInputPrecheck(body.message, body.locale);
      if (precheck.status === "block" && precheck.response) {
        return reply.code(200).send({
          ...precheck.response,
          safety: { status: "blocked", category: precheck.category, matches: precheck.matches },
        });
      }

      const responseText = [
        "Danke, dass du das teilst.",
        "Wenn es okay ist, lass uns einen kurzen Moment innehalten und gemeinsam tief durchatmen.",
        "Spüre, wie dein Atem kommt und geht, ohne ihn zu bewerten.",
      ].join(" ");

      const outputCheck = runOutputFilter(responseText, body.locale);
      if (outputCheck.status === "block" && outputCheck.response) {
        return reply.code(200).send({
          ...outputCheck.response,
          safety: { status: "blocked", category: outputCheck.category, matches: outputCheck.matches },
        });
      }

      return reply.code(200).send({
        message: responseText,
        disclaimer: buildDisclaimer(body.locale),
        safety: { status: "ok", category: "none" },
      });
    });

    v1.post("/mood", async (_request, reply) => {
      if (!config.featureFlags.enableMoodTracking) {
        return reply.code(404).send({ error: "Mood tracking feature disabled" });
      }
      return reply.code(501).send({ message: "Not implemented" });
    });
  }, { prefix: "/v1" });
};
