import Fastify from "fastify";
import { config } from "./config";
import { registerObservability } from "./observability";
import { registerV1Routes } from "./routes/v1";

const app = Fastify({
  logger: true
});

registerObservability(app);

app.get("/health", async () => ({ status: "ok" }));

const start = async (): Promise<void> => {
  try {
    await registerV1Routes(app);
    await app.listen({
      host: config.server.host,
      port: config.server.port
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

void start();
