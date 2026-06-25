import { mock, describe, it, expect, beforeEach } from "bun:test";
import { dbMock } from "../../helpers/db.mock";
import { signTestToken, authHeader } from "../../helpers/jwt";

mock.module("@/backend/db", () => ({ db: dbMock }));

const { userRoutes } = await import("@/backend/routes/users");
const { Elysia } = await import("elysia");

const app = new Elysia().use(userRoutes);

const USER_ID = crypto.randomUUID();

function userRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: USER_ID,
    email: "person@example.com",
    parameters_id: 1,
    updated_at: 1000,
    auto_start_work: true,
    auto_start_rest: false,
    auto_restart_cycle: true,
    notifications_on: false,
    parameters_updated_at: 1000,
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
    const res = await app.handle(new Request("http://localhost/api/users"));
    expect(res.status).toBe(401);
    expect(dbMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/users", () => {
  it("returns the list of users", async () => {
    dbMock.mockResolvedValueOnce([userRow()]);

    const res = await app.handle(
      new Request("http://localhost/api/users", { headers: authCookie })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe(USER_ID);
  });
});

describe("GET /api/users/:id", () => {
  it("returns the user when found", async () => {
    dbMock.mockResolvedValueOnce([userRow()]);

    const res = await app.handle(
      new Request(`http://localhost/api/users/${USER_ID}`, { headers: authCookie })
    );

    expect(res.status).toBe(200);
    expect((await res.json()).id).toBe(USER_ID);
  });

  it("returns 404 when the user does not exist", async () => {
    dbMock.mockResolvedValueOnce([]);

    const res = await app.handle(
      new Request(`http://localhost/api/users/${USER_ID}`, { headers: authCookie })
    );

    expect(res.status).toBe(404);
  });
});

describe("PUT /api/users/:id", () => {
  it("updates the user and returns the new shape", async () => {
    dbMock
      .mockResolvedValueOnce([{ id: USER_ID }]) // UPDATE ... RETURNING id
      .mockResolvedValueOnce([userRow({ email: "new@example.com" })]); // getUserById

    const res = await app.handle(
      new Request(`http://localhost/api/users/${USER_ID}`, {
        method: "PUT",
        headers: { ...authCookie, "content-type": "application/json" },
        body: JSON.stringify({ email: "new@example.com" }),
      })
    );

    expect(res.status).toBe(200);
    expect((await res.json()).email).toBe("new@example.com");
  });

  it("returns 409 when the new email is already taken", async () => {
    dbMock.mockImplementationOnce(async () => {
      throw { errno: "23505" };
    });

    const res = await app.handle(
      new Request(`http://localhost/api/users/${USER_ID}`, {
        method: "PUT",
        headers: { ...authCookie, "content-type": "application/json" },
        body: JSON.stringify({ email: "taken@example.com" }),
      })
    );

    expect(res.status).toBe(409);
  });

  it("returns 404 when updating a user that does not exist", async () => {
    dbMock.mockResolvedValueOnce([]);

    const res = await app.handle(
      new Request(`http://localhost/api/users/${USER_ID}`, {
        method: "PUT",
        headers: { ...authCookie, "content-type": "application/json" },
        body: JSON.stringify({ email: "new@example.com" }),
      })
    );

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/users/:id", () => {
  it("deletes the user and returns 204", async () => {
    dbMock.mockResolvedValueOnce([{ id: USER_ID }]);

    const res = await app.handle(
      new Request(`http://localhost/api/users/${USER_ID}`, {
        method: "DELETE",
        headers: authCookie,
      })
    );

    expect(res.status).toBe(204);
  });

  it("returns 404 when deleting a user that does not exist", async () => {
    dbMock.mockResolvedValueOnce([]);

    const res = await app.handle(
      new Request(`http://localhost/api/users/${USER_ID}`, {
        method: "DELETE",
        headers: authCookie,
      })
    );

    expect(res.status).toBe(404);
  });
});

describe("PUT /api/users/:id/parameters", () => {
  it("updates the parameters and returns the user", async () => {
    dbMock
      .mockResolvedValueOnce([{ id: USER_ID }]) // UPDATE parameters ... RETURNING u.id
      .mockResolvedValueOnce([userRow({ auto_start_work: false })]); // getUserById

    const res = await app.handle(
      new Request(`http://localhost/api/users/${USER_ID}/parameters`, {
        method: "PUT",
        headers: { ...authCookie, "content-type": "application/json" },
        body: JSON.stringify({ autoStartWork: false }),
      })
    );

    expect(res.status).toBe(200);
    expect((await res.json()).parameters.autoStartWork).toBe(false);
  });

  it("returns 404 when the user does not exist", async () => {
    dbMock.mockResolvedValueOnce([]);

    const res = await app.handle(
      new Request(`http://localhost/api/users/${USER_ID}/parameters`, {
        method: "PUT",
        headers: { ...authCookie, "content-type": "application/json" },
        body: JSON.stringify({ autoStartWork: false }),
      })
    );

    expect(res.status).toBe(404);
  });
});
