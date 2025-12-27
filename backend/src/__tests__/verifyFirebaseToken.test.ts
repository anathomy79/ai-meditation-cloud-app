import type { FastifyReply, FastifyRequest } from "fastify";
import { verifyFirebaseToken } from "../middleware/verifyFirebaseToken";

const makeReply = (): FastifyReply =>
  ({
    code: jest.fn().mockReturnThis(),
    send: jest.fn()
  }) as unknown as FastifyReply;

describe("verifyFirebaseToken", () => {
  it("sets request.user when token is valid", async () => {
    const request = {
      headers: { authorization: "Bearer test-token" },
      log: { error: jest.fn() }
    } as unknown as FastifyRequest;
    const reply = makeReply();
    const { verifyIdTokenMock } = jest.requireMock("firebase-admin") as {
      verifyIdTokenMock: jest.Mock;
    };

    await verifyFirebaseToken(request, reply);

    expect(verifyIdTokenMock).toHaveBeenCalledWith("test-token");
    expect(request.user).toEqual({ uid: "test-user", token: "test-token" });
  });
});
