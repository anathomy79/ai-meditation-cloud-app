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

      const outputCandidate = "Not implemented";
      const outputCheck = runOutputFilter(outputCandidate, body.locale);
      if (outputCheck.status === "block" && outputCheck.response) {
        return reply.code(200).send({
          ...outputCheck.response,
          safety: { status: "blocked", category: outputCheck.category, matches: outputCheck.matches },
        });
      }

      return reply.code(501).send({
        message: "Not implemented",
        disclaimer: buildDisclaimer(body.locale),
        safety: { status: "pending", category: "none" },
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

      const historyText = body.history
        ? body.history.map((entry) => entry.content).join(" ")
        : "";
      const precheck = runInputPrecheck(`${body.message} ${historyText}`.trim(), body.locale);
      if (precheck.status === "block" && precheck.response) {
        return reply.code(200).send({
          ...precheck.response,
          safety: { status: "blocked", category: precheck.category, matches: precheck.matches },
        });
      }

      const outputCandidate = "Not implemented";
      const outputCheck = runOutputFilter(outputCandidate, body.locale);
      if (outputCheck.status === "block" && outputCheck.response) {
        return reply.code(200).send({
          ...outputCheck.response,
          safety: { status: "blocked", category: outputCheck.category, matches: outputCheck.matches },
        });
      }

      return reply.code(501).send({
        message: "Not implemented",
        disclaimer: buildDisclaimer(body.locale),
        safety: { status: "pending", category: "none" },
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
