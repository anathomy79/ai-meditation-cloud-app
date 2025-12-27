import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuth } from "firebase-admin/auth";
import { ensureFirebaseApp } from "../firebase";

export const verifyFirebaseToken = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    await ensureFirebaseApp();
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      reply.code(401).send({ error: "Missing Authorization header" });
      return;
    }

    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
      reply.code(401).send({ error: "Invalid Authorization header" });
      return;
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    request.user = decodedToken;
  } catch (error) {
    request.log.error({ error }, "Failed to verify Firebase token");
    reply.code(401).send({ error: "Unauthorized" });
  }
};
