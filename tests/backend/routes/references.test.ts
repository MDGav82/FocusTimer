import { mock, describe, it, expect, beforeEach } from "bun:test";
import { dbMock } from "../../helpers/db.mock";

mock.module("@/backend/db", () => ({ db: dbMock }));

const { referenceRoutes } = await import("@/backend/routes/references");
const { Elysia } = await import("elysia");

const app = new Elysia().use(referenceRoutes);

beforeEach(() => {
  dbMock.mockReset();
});

describe("GET /api/status", () => {
  it("does not require authentication", async () => {
    dbMock.mockResolvedValueOnce([{ id: 1, name: "pending" }]);

    const res = await app.handle(new Request("http://localhost/api/status"));

    expect(res.status).toBe(200);
    expect((await res.json())[0].name).toBe("pending");
  });

  it("returns 500 on a db error", async () => {
    dbMock.mockImplementationOnce(async () => {
      throw new Error("connection refused");
    });

    const res = await app.handle(new Request("http://localhost/api/status"));

    expect(res.status).toBe(500);
  });
});

describe("GET /api/type_periode", () => {
  it("does not require authentication", async () => {
    dbMock.mockResolvedValueOnce([{ id: 1, name: "work" }]);

    const res = await app.handle(new Request("http://localhost/api/type_periode"));

    expect(res.status).toBe(200);
    expect((await res.json())[0].name).toBe("work");
  });
});
