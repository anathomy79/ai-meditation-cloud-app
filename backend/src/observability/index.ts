import type { FastifyInstance } from "fastify";
import { registerCloudLogging } from "./logging";
import { registerErrorReporting } from "./errorReporting";

export const registerObservability = (app: FastifyInstance): void => {
  registerCloudLogging(app);
  registerErrorReporting(app);
};
