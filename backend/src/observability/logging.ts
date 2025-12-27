import { Logging } from "@google-cloud/logging";
import type { FastifyInstance } from "fastify";
import { config } from "../config";

const logging = new Logging({
  projectId: config.gcp.projectId || undefined,
});

const log = logging.log("ai-meditation-backend");

const resource = {
  type: "cloud_run_revision",
  labels: {
    service_name: config.service.name,
    revision_name: config.service.version,
    location: process.env.GCP_REGION || process.env.REGION || "europe-west1",
  },
};

const writeLog = async (severity: "INFO" | "ERROR", payload: Record<string, unknown>) => {
  const entry = log.entry({ resource, severity }, payload);
  try {
    await log.write(entry);
  } catch (error) {
    // Avoid throwing in logging hooks.
  }
};

export const registerCloudLogging = (app: FastifyInstance): void => {
  if (!config.observability.enableCloudLogging) {
    return;
  }

  app.addHook("onRequest", async (request) => {
    request.requestStart = Date.now();
  });

  app.addHook("onResponse", async (request, reply) => {
    const durationMs = request.requestStart ? Date.now() - request.requestStart : undefined;
    await writeLog("INFO", {
      event: "request",
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      durationMs,
    });
  });

  app.addHook("onError", async (request, reply, error) => {
    await writeLog("ERROR", {
      event: "error",
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      message: error.message,
      stack: error.stack,
    });
  });
};
