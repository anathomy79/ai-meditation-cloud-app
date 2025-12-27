import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { config } from "../config";
import { deleteUserData, exportUserData } from "../db/userData";
import { verifyFirebaseToken } from "../middleware/verifyFirebaseToken";

export const registerV1Routes = async (app: FastifyInstance): Promise<void> => {
  app.register(async (v1) => {
    v1.addHook("preHandler", verifyFirebaseToken);

    const requireUserId = (request: FastifyRequest, reply: FastifyReply) => {
      const uid = request.user?.uid;
      if (!uid) {
        reply.code(401).send({ error: "Unauthorized" });
        return null;
      }
      return uid;
    };

    v1.get("/user/export", async (request, reply) => {
      const uid = requireUserId(request, reply);
      if (!uid) {
        return;
      }
      const payload = await exportUserData(uid);
      return reply.send(payload);
    });

    v1.delete("/user", async (request, reply) => {
      const uid = requireUserId(request, reply);
      if (!uid) {
        return;
      }
      const result = await deleteUserData(uid);
      return reply.send(result);
    });

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
