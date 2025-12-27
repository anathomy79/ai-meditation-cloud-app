import { ErrorReporting } from "@google-cloud/error-reporting";
import type { FastifyInstance } from "fastify";
import { config } from "../config";

const errorReporting = config.observability.enableErrorReporting
  ? new ErrorReporting({
      projectId: config.gcp.projectId || undefined,
      serviceContext: {
        service: config.service.name,
        version: config.service.version,
      },
    })
  : null;

export const reportError = (error: Error): void => {
  if (!errorReporting) {
    return;
  }
  errorReporting.report(error);
};

export const registerErrorReporting = (app: FastifyInstance): void => {
  if (!errorReporting) {
    return;
  }

  app.addHook("onError", async (_request, _reply, error) => {
    reportError(error);
  });
};
