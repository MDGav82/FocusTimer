import { mock, describe, it, expect, beforeEach } from "bun:test";
import { dbMock } from "../../helpers/db.mock";
import { signTestToken, authHeader } from "../../helpers/jwt";

mock.module("@/backend/db", () => ({ db: dbMock }));

const { historyRoutes } = await import("@/backend/routes/history");
const { Elysia } = await import("elysia");

const app = new Elysia().use(historyRoutes);

const USER_ID = crypto.randomUUID();
const ENTRY_ID = 42;
const CYCLE_ID = crypto.randomUUID();
const TYPE_PERIODE_ID = 1;

function historyRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: ENTRY_ID,
    start_date: new Date().toISOString(),
    time_spent: 1500,
    type_name: "work",
    task_title: null,
    cycle_name: "Focus cycle",
    ...overrides,
  };
}

let authCookie: Record<string, string>;

beforeEach(async () => {
  dbMock.mockReset();
  authCookie = authHeader(await signTestToken({ id: USER_ID, email: "person@example.com" }));
});

describe("auth guard", () => {
  it("rejects unauthenticated requests with 401", async () => {
    const res = await app.handle(new Request(`http://localhost/api/users/${USER_ID}/history`));
    expect(res.status).toBe(401);
    expect(dbMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/users/:id/history", () => {
  it("returns the user's history entries", async () => {
    dbMock.mockResolvedValueOnce([historyRow()]);

    const res = await app.handle(
      new Request(`http://localhost/api/users/${USER_ID}/history`, { headers: authCookie })
    );

    expect(res.status).toBe(200);
    expect((await res.json())[0].id).toBe(ENTRY_ID);
  });

  it("returns 500 on a db error", async () => {
    dbMock.mockImplementationOnce(async () => {
      throw new Error("connection refused");
    });

    const res = await app.handle(
      new Request(`http://localhost/api/users/${USER_ID}/history`, { headers: authCookie })
    );

    expect(res.status).toBe(500);
  });
});

describe("POST /api/users/:id/history", () => {
  it("creates a history entry and returns 201", async () => {
    dbMock.mockResolvedValueOnce([historyRow()]);

    const res = await app.handle(
      new Request(`http://localhost/api/users/${USER_ID}/history`, {
        method: "POST",
        headers: { ...authCookie, "content-type": "application/json" },
        body: JSON.stringify({ type_periode_id: TYPE_PERIODE_ID, cycle_id: CYCLE_ID, time_spent: 1500 }),
      })
    );

    expect(res.status).toBe(201);
    expect((await res.json()).id).toBe(ENTRY_ID);
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await app.handle(
      new Request(`http://localhost/api/users/${USER_ID}/history`, {
        method: "POST",
        headers: { ...authCookie, "content-type": "application/json" },
        body: JSON.stringify({ time_spent: 1500 }),
      })
    );

    expect(res.status).toBe(400);
    expect(dbMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/history/:id", () => {
  it("returns the entry when found", async () => {
    dbMock.mockResolvedValueOnce([historyRow()]);

    const res = await app.handle(
      new Request(`http://localhost/api/history/${ENTRY_ID}`, { headers: authCookie })
    );

    expect(res.status).toBe(200);
    expect((await res.json()).id).toBe(ENTRY_ID);
  });

  it("returns 404 when the entry does not exist", async () => {
    dbMock.mockResolvedValueOnce([]);

    const res = await app.handle(
      new Request(`http://localhost/api/history/${ENTRY_ID}`, { headers: authCookie })
    );

    expect(res.status).toBe(404);
  });
});

describe("PUT /api/history/:id", () => {
  it("updates the entry", async () => {
    dbMock.mockResolvedValueOnce([historyRow({ time_spent: 3000 })]);

    const res = await app.handle(
      new Request(`http://localhost/api/history/${ENTRY_ID}`, {
        method: "PUT",
        headers: { ...authCookie, "content-type": "application/json" },
        body: JSON.stringify({ time_spent: 3000 }),
      })
    );

    expect(res.status).toBe(200);
    expect((await res.json()).time_spent).toBe(3000);
  });

  it("returns 404 when the entry does not exist", async () => {
    dbMock.mockResolvedValueOnce([]);

    const res = await app.handle(
      new Request(`http://localhost/api/history/${ENTRY_ID}`, {
        method: "PUT",
        headers: { ...authCookie, "content-type": "application/json" },
        body: JSON.stringify({ time_spent: 3000 }),
      })
    );

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/history/:id", () => {
  it("deletes the entry and returns 204", async () => {
    dbMock.mockResolvedValueOnce([{ id: ENTRY_ID }]);

    const res = await app.handle(
      new Request(`http://localhost/api/history/${ENTRY_ID}`, { method: "DELETE", headers: authCookie })
    );

    expect(res.status).toBe(204);
  });

  it("returns 404 when deleting an entry that does not exist", async () => {
    dbMock.mockResolvedValueOnce([]);

    const res = await app.handle(
      new Request(`http://localhost/api/history/${ENTRY_ID}`, { method: "DELETE", headers: authCookie })
    );

    expect(res.status).toBe(404);
  });
});
