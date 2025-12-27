import type { FastifyReply, FastifyRequest } from "fastify";
import admin from "firebase-admin";
import { config } from "../config";

const initializeFirebase = (): void => {
  if (admin.apps.length > 0) {
    return;
  }

  if (config.firebase.serviceAccountJson) {
    const serviceAccount = JSON.parse(config.firebase.serviceAccountJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    return;
  }

  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: config.firebase.projectId || undefined
  });
};

export const verifyFirebaseToken = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    initializeFirebase();
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

    const decodedToken = await admin.auth().verifyIdToken(token);
    request.user = decodedToken;
  } catch (error) {
    request.log.error({ error }, "Failed to verify Firebase token");
    reply.code(401).send({ error: "Unauthorized" });
  }
};
