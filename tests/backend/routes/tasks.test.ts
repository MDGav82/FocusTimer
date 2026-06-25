import { mock, describe, it, expect, beforeEach } from "bun:test";
import { dbMock } from "../../helpers/db.mock";
import { signTestToken, authHeader } from "../../helpers/jwt";

mock.module("@/backend/db", () => ({ db: dbMock }));

const { taskRoutes } = await import("@/backend/routes/tasks");
const { Elysia } = await import("elysia");

const app = new Elysia().use(taskRoutes);

const USER_ID = crypto.randomUUID();
const TASK_ID = crypto.randomUUID();

function taskRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: TASK_ID,
    user_id: USER_ID,
    title: "Write tests",
    description: "Cover the task routes",
    estimated_time: 1500,
    progress: 0,
    time_spent: 0,
    creation_date: new Date().toISOString(),
    start_date: null,
    end_date: null,
    updated_at: 1000,
    status_name: "pending",
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
    const res = await app.handle(new Request(`http://localhost/api/users/${USER_ID}/tasks`));
    expect(res.status).toBe(401);
    expect(dbMock).not.toHaveBeenCalled();
  });
});

describe("authorization (IDOR)", () => {
  it("returns 403 (without a db call) when listing another user's tasks", async () => {
    const otherId = crypto.randomUUID();

    const res = await app.handle(
      new Request(`http://localhost/api/users/${otherId}/tasks`, { headers: authCookie })
    );

    expect(res.status).toBe(403);
    expect(dbMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/users/:id/tasks", () => {
  it("returns the user's tasks", async () => {
    dbMock.mockResolvedValueOnce([taskRow()]);

    const res = await app.handle(
      new Request(`http://localhost/api/users/${USER_ID}/tasks`, { headers: authCookie })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].status).toBe(0);
  });
});

describe("POST /api/users/:id/tasks", () => {
  it("creates a task and returns 201", async () => {
    dbMock
      .mockResolvedValueOnce([{ id: TASK_ID }]) // INSERT ... RETURNING id
      .mockResolvedValueOnce([taskRow()]); // getTaskById

    const res = await app.handle(
      new Request(`http://localhost/api/users/${USER_ID}/tasks`, {
        method: "POST",
        headers: { ...authCookie, "content-type": "application/json" },
        body: JSON.stringify({ id: TASK_ID, title: "Write tests" }),
      })
    );

    expect(res.status).toBe(201);
    expect((await res.json()).title).toBe("Write tests");
  });

  it("rejects an invalid body before touching the db", async () => {
    const res = await app.handle(
      new Request(`http://localhost/api/users/${USER_ID}/tasks`, {
        method: "POST",
        headers: { ...authCookie, "content-type": "application/json" },
        body: JSON.stringify({ id: TASK_ID }), // missing required `title`
      })
    );

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    expect(dbMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/tasks/:id", () => {
  it("returns the task when found", async () => {
    dbMock.mockResolvedValueOnce([taskRow()]);

    const res = await app.handle(
      new Request(`http://localhost/api/tasks/${TASK_ID}`, { headers: authCookie })
    );

    expect(res.status).toBe(200);
    expect((await res.json()).id).toBe(TASK_ID);
  });

  it("returns 404 when the task does not exist", async () => {
    dbMock.mockResolvedValueOnce([]);

    const res = await app.handle(
      new Request(`http://localhost/api/tasks/${TASK_ID}`, { headers: authCookie })
    );

    expect(res.status).toBe(404);
  });
});

describe("PUT /api/tasks/:id", () => {
  it("updates the task and returns the new shape", async () => {
    dbMock
      .mockResolvedValueOnce([{ id: TASK_ID }]) // UPDATE ... RETURNING id
      .mockResolvedValueOnce([taskRow({ status_name: "progress", progress: 50 })]);

    const res = await app.handle(
      new Request(`http://localhost/api/tasks/${TASK_ID}`, {
        method: "PUT",
        headers: { ...authCookie, "content-type": "application/json" },
        body: JSON.stringify({ status: 1, progress: 50 }),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe(1);
    expect(body.progress).toBe(50);
  });

  it("returns 404 when updating a task that does not exist", async () => {
    dbMock.mockResolvedValueOnce([]);

    const res = await app.handle(
      new Request(`http://localhost/api/tasks/${TASK_ID}`, {
        method: "PUT",
        headers: { ...authCookie, "content-type": "application/json" },
        body: JSON.stringify({ progress: 50 }),
      })
    );

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/tasks/:id", () => {
  it("deletes the task and returns 204", async () => {
    dbMock.mockResolvedValueOnce([{ id: TASK_ID }]);

    const res = await app.handle(
      new Request(`http://localhost/api/tasks/${TASK_ID}`, { method: "DELETE", headers: authCookie })
    );

    expect(res.status).toBe(204);
  });

  it("returns 404 when deleting a task that does not exist", async () => {
    dbMock.mockResolvedValueOnce([]);

    const res = await app.handle(
      new Request(`http://localhost/api/tasks/${TASK_ID}`, { method: "DELETE", headers: authCookie })
    );

    expect(res.status).toBe(404);
  });
});
