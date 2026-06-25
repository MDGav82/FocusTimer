import { mock, describe, it, expect, beforeEach } from "bun:test";
import { dbMock } from "../../helpers/db.mock";
import { signTestToken, authHeader } from "../../helpers/jwt";

mock.module("@/backend/db", () => ({ db: dbMock }));

const { cycleRoutes } = await import("@/backend/routes/cycles");
const { Elysia } = await import("elysia");

const app = new Elysia().use(cycleRoutes);

const USER_ID = crypto.randomUUID();
const CYCLE_ID = crypto.randomUUID();
const PERIOD_ID = crypto.randomUUID();

function cycleRow(overrides: Partial<Record<string, unknown>> = {}) {
  return { id: CYCLE_ID, user_id: USER_ID, name: "Focus cycle", updated_at: 1000, ...overrides };
}

function periodRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: PERIOD_ID,
    cycle_id: CYCLE_ID,
    time: 1500,
    index: 1,
    updated_at: 1000,
    type_name: "work",
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
    const res = await app.handle(new Request(`http://localhost/api/users/${USER_ID}/cycles`));
    expect(res.status).toBe(401);
    expect(dbMock).not.toHaveBeenCalled();
  });
});

describe("authorization (IDOR)", () => {
  it("returns 403 (without a db call) when listing another user's cycles", async () => {
    const otherId = crypto.randomUUID();

    const res = await app.handle(
      new Request(`http://localhost/api/users/${otherId}/cycles`, { headers: authCookie })
    );

    expect(res.status).toBe(403);
    expect(dbMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/users/:id/cycles", () => {
  it("returns the user's cycles", async () => {
    dbMock.mockResolvedValueOnce([cycleRow()]);

    const res = await app.handle(
      new Request(`http://localhost/api/users/${USER_ID}/cycles`, { headers: authCookie })
    );

    expect(res.status).toBe(200);
    expect((await res.json())[0].id).toBe(CYCLE_ID);
  });
});

describe("POST /api/users/:id/cycles", () => {
  it("creates a cycle and returns 201", async () => {
    dbMock.mockResolvedValueOnce([cycleRow()]);

    const res = await app.handle(
      new Request(`http://localhost/api/users/${USER_ID}/cycles`, {
        method: "POST",
        headers: { ...authCookie, "content-type": "application/json" },
        body: JSON.stringify({ name: "Focus cycle" }),
      })
    );

    expect(res.status).toBe(201);
    expect((await res.json()).name).toBe("Focus cycle");
  });
});

describe("GET /api/cycles/:id", () => {
  it("returns the cycle when found", async () => {
    dbMock.mockResolvedValueOnce([cycleRow()]);

    const res = await app.handle(
      new Request(`http://localhost/api/cycles/${CYCLE_ID}`, { headers: authCookie })
    );

    expect(res.status).toBe(200);
    expect((await res.json()).id).toBe(CYCLE_ID);
  });

  it("returns 404 when the cycle does not exist", async () => {
    dbMock.mockResolvedValueOnce([]);

    const res = await app.handle(
      new Request(`http://localhost/api/cycles/${CYCLE_ID}`, { headers: authCookie })
    );

    expect(res.status).toBe(404);
  });
});

describe("PUT /api/cycles/:id", () => {
  it("updates the cycle name", async () => {
    dbMock
      .mockResolvedValueOnce([{ id: CYCLE_ID }]) // UPDATE ... RETURNING id
      .mockResolvedValueOnce([cycleRow({ name: "Renamed" })]); // getCycleById

    const res = await app.handle(
      new Request(`http://localhost/api/cycles/${CYCLE_ID}`, {
        method: "PUT",
        headers: { ...authCookie, "content-type": "application/json" },
        body: JSON.stringify({ name: "Renamed" }),
      })
    );

    expect(res.status).toBe(200);
    expect((await res.json()).name).toBe("Renamed");
  });

  it("returns 404 when updating a cycle that does not exist", async () => {
    dbMock.mockResolvedValueOnce([]);

    const res = await app.handle(
      new Request(`http://localhost/api/cycles/${CYCLE_ID}`, {
        method: "PUT",
        headers: { ...authCookie, "content-type": "application/json" },
        body: JSON.stringify({ name: "Renamed" }),
      })
    );

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/cycles/:id", () => {
  it("deletes the cycle and returns 204", async () => {
    dbMock.mockResolvedValueOnce([{ id: CYCLE_ID }]);

    const res = await app.handle(
      new Request(`http://localhost/api/cycles/${CYCLE_ID}`, { method: "DELETE", headers: authCookie })
    );

    expect(res.status).toBe(204);
  });

  it("returns 404 when deleting a cycle that does not exist", async () => {
    dbMock.mockResolvedValueOnce([]);

    const res = await app.handle(
      new Request(`http://localhost/api/cycles/${CYCLE_ID}`, { method: "DELETE", headers: authCookie })
    );

    expect(res.status).toBe(404);
  });
});

describe("GET /api/cycles/:id/periods", () => {
  it("returns 404 when the parent cycle does not exist", async () => {
    dbMock.mockResolvedValueOnce([]);

    const res = await app.handle(
      new Request(`http://localhost/api/cycles/${CYCLE_ID}/periods`, { headers: authCookie })
    );

    expect(res.status).toBe(404);
  });

  it("returns the cycle's periods", async () => {
    dbMock
      .mockResolvedValueOnce([{ id: CYCLE_ID }]) // cycle existence check
      .mockResolvedValueOnce([periodRow()]); // periods select

    const res = await app.handle(
      new Request(`http://localhost/api/cycles/${CYCLE_ID}/periods`, { headers: authCookie })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body[0].typePeriode).toBe(0);
  });
});

describe("POST /api/cycles/:id/periods", () => {
  it("creates a period and returns 201", async () => {
    dbMock
      .mockResolvedValueOnce([{ id: PERIOD_ID }]) // INSERT ... RETURNING id
      .mockResolvedValueOnce([periodRow()]); // getPeriodById

    const res = await app.handle(
      new Request(`http://localhost/api/cycles/${CYCLE_ID}/periods`, {
        method: "POST",
        headers: { ...authCookie, "content-type": "application/json" },
        body: JSON.stringify({ id: PERIOD_ID, typePeriode: 0, time: 1500, index: 1 }),
      })
    );

    expect(res.status).toBe(201);
    expect((await res.json()).typePeriode).toBe(0);
  });
});

describe("GET /api/periods/:id", () => {
  it("returns the period when found", async () => {
    dbMock.mockResolvedValueOnce([periodRow()]);

    const res = await app.handle(
      new Request(`http://localhost/api/periods/${PERIOD_ID}`, { headers: authCookie })
    );

    expect(res.status).toBe(200);
    expect((await res.json()).id).toBe(PERIOD_ID);
  });

  it("returns 404 when the period does not exist", async () => {
    dbMock.mockResolvedValueOnce([]);

    const res = await app.handle(
      new Request(`http://localhost/api/periods/${PERIOD_ID}`, { headers: authCookie })
    );

    expect(res.status).toBe(404);
  });
});

describe("PUT /api/periods/:id", () => {
  it("updates the period", async () => {
    dbMock
      .mockResolvedValueOnce([{ id: PERIOD_ID }]) // UPDATE ... RETURNING id
      .mockResolvedValueOnce([periodRow({ time: 3000 })]); // getPeriodById

    const res = await app.handle(
      new Request(`http://localhost/api/periods/${PERIOD_ID}`, {
        method: "PUT",
        headers: { ...authCookie, "content-type": "application/json" },
        body: JSON.stringify({ time: 3000 }),
      })
    );

    expect(res.status).toBe(200);
    expect((await res.json()).time).toBe(3000);
  });

  it("returns 404 when updating a period that does not exist", async () => {
    dbMock.mockResolvedValueOnce([]);

    const res = await app.handle(
      new Request(`http://localhost/api/periods/${PERIOD_ID}`, {
        method: "PUT",
        headers: { ...authCookie, "content-type": "application/json" },
        body: JSON.stringify({ time: 3000 }),
      })
    );

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/periods/:id", () => {
  it("deletes the period and returns 204", async () => {
    dbMock.mockResolvedValueOnce([{ id: PERIOD_ID }]);

    const res = await app.handle(
      new Request(`http://localhost/api/periods/${PERIOD_ID}`, { method: "DELETE", headers: authCookie })
    );

    expect(res.status).toBe(204);
  });

  it("returns 404 when deleting a period that does not exist", async () => {
    dbMock.mockResolvedValueOnce([]);

    const res = await app.handle(
      new Request(`http://localhost/api/periods/${PERIOD_ID}`, { method: "DELETE", headers: authCookie })
    );

    expect(res.status).toBe(404);
  });
});
