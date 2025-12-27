import Fastify from "fastify";
import { registerV1Routes } from "./routes/v1";

export const buildApp = async () => {
  const app = Fastify({
    logger: true
  });

  app.get("/health", async () => ({ status: "ok" }));
  await registerV1Routes(app);

  return app;
};
