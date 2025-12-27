import request from "supertest";
import { buildApp } from "../app";

describe("health endpoint", () => {
  it("returns ok status", async () => {
    const app = await buildApp();
    await app.ready();

    const response = await request(app.server).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
    await app.close();
  });
});
