import type { FastifyInstance } from "fastify";
import { config } from "../config";
import { verifyFirebaseToken } from "../middleware/verifyFirebaseToken";

export const registerV1Routes = async (app: FastifyInstance): Promise<void> => {
  app.register(async (v1) => {
    v1.addHook("preHandler", verifyFirebaseToken);

    v1.post("/sessions", async (_request, reply) => {
      if (!config.featureFlags.enableSessions) {
        return reply.code(404).send({ error: "Sessions feature disabled" });
      }
      return reply.code(501).send({ message: "Not implemented" });
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
