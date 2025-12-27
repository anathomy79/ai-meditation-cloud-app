import { config } from "./config";
import { buildApp } from "./app";

const start = async (): Promise<void> => {
  try {
    const app = await buildApp();
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
