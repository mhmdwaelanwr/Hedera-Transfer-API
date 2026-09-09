import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

describe("Hedera Transfer Service v2", () => {
  const app = createApp();

  it("reports health without touching Hedera", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.network).toBe("testnet");
  });

  it("rejects malformed Hedera account IDs before upstream calls", async () => {
    const response = await request(app).get("/account/balance/not-an-account");
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid request");
  });

  it("rejects invalid transfer payloads without echoing secrets", async () => {
    const response = await request(app)
      .post("/account/transaction")
      .send({
        accountId: "0.0.1001",
        privateKey: "secret",
        receiverAccountId: "0.0.1002",
        amount: -5,
      });

    expect(response.status).toBe(400);
    expect(JSON.stringify(response.body)).not.toContain("secret");
  });

  it("returns JSON for unknown routes", async () => {
    const response = await request(app).get("/does-not-exist");
    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Route not found");
  });
});
