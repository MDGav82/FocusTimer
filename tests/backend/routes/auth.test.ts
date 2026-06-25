import { mock, describe, it, expect, beforeEach } from "bun:test";
import { dbMock } from "../../helpers/db.mock";
import { signTestToken, authHeader } from "../../helpers/jwt";

// Must run before the dynamic import below — see tests/helpers/db.mock.ts.
mock.module("@/backend/db", () => ({ db: dbMock }));

const { authRoutes } = await import("@/backend/routes/auth");
const { Elysia } = await import("elysia");

const app = new Elysia().use(authRoutes);

const validParameters = {
  autoStartWork: true,
  autoStartRest: false,
  autoRestartCycle: true,
  notificationsOn: false,
};

const USER_ID = crypto.randomUUID();
const USER_EMAIL = "person@example.com";

function userRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: USER_ID,
    email: USER_EMAIL,
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

beforeEach(() => {
  dbMock.mockReset();
});

describe("POST /api/auth/register", () => {
  it("creates the user and returns 201 with the user shape", async () => {
    dbMock
      .mockResolvedValueOnce([{ id: 1 }]) // insert parameters
      .mockResolvedValueOnce([{ id: USER_ID, email: USER_EMAIL }]) // insert users
      .mockResolvedValueOnce([userRow()]); // getUserById join

    const res = await app.handle(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: USER_ID,
          email: USER_EMAIL,
          password: "password123",
          parameters: validParameters,
        }),
      })
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe(USER_ID);
    expect(body.email).toBe(USER_EMAIL);
    expect(body.parameters.autoStartWork).toBe(true);
    expect(res.headers.get("set-cookie")).toContain("token=");
  });

  it("returns 409 when the email is already taken", async () => {
    dbMock.mockImplementationOnce(async () => {
      throw { errno: "23505" };
    });

    const res = await app.handle(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: USER_ID,
          email: USER_EMAIL,
          password: "password123",
          parameters: validParameters,
        }),
      })
    );

    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("Email already in use");
  });

  it("returns 500 on an unexpected db error", async () => {
    dbMock.mockImplementationOnce(async () => {
      throw new Error("connection refused");
    });

    const res = await app.handle(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: USER_ID,
          email: USER_EMAIL,
          password: "password123",
          parameters: validParameters,
        }),
      })
    );

    expect(res.status).toBe(500);
  });

  it("rejects an invalid body before touching the db", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: USER_ID,
          email: "not-an-email",
          password: "password123",
          parameters: validParameters,
        }),
      })
    );

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    expect(dbMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with valid credentials and sets the cookie", async () => {
    const hashed = await Bun.password.hash("password123");
    dbMock
      .mockResolvedValueOnce([{ ...userRow(), password: hashed }]) // lookup by email
      .mockResolvedValueOnce([userRow()]); // getUserById join

    const res = await app.handle(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: USER_ID,
          email: USER_EMAIL,
          password: "password123",
        }),
      })
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain("token=");
  });

  it("returns 401 when the user does not exist", async () => {
    dbMock.mockResolvedValueOnce([]);

    const res = await app.handle(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: USER_ID,
          email: "nobody@example.com",
          password: "password123",
        }),
      })
    );

    expect(res.status).toBe(401);
  });

  it("returns 401 when the password is wrong", async () => {
    const hashed = await Bun.password.hash("the-real-password");
    dbMock.mockResolvedValueOnce([{ ...userRow(), password: hashed }]);

    const res = await app.handle(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: USER_ID,
          email: USER_EMAIL,
          password: "wrong-password",
        }),
      })
    );

    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the cookie and returns a message", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/auth/logout", { method: "POST" })
    );

    expect(res.status).toBe(200);
    expect((await res.json()).message).toBe("Logged out");
    expect(res.headers.get("set-cookie")).toMatch(/token=;|Max-Age=0/);
  });
});

describe("GET /api/auth/me", () => {
  it("returns 401 when there is no cookie", async () => {
    const res = await app.handle(new Request("http://localhost/api/auth/me"));
    expect(res.status).toBe(401);
  });

  it("returns the current user when the cookie is valid", async () => {
    const token = await signTestToken({ id: USER_ID, email: USER_EMAIL });
    dbMock.mockResolvedValueOnce([userRow()]);

    const res = await app.handle(
      new Request("http://localhost/api/auth/me", { headers: authHeader(token) })
    );

    expect(res.status).toBe(200);
    expect((await res.json()).id).toBe(USER_ID);
  });

  it("returns 401 when the user from the token no longer exists", async () => {
    const token = await signTestToken({ id: USER_ID, email: USER_EMAIL });
    dbMock.mockResolvedValueOnce([]);

    const res = await app.handle(
      new Request("http://localhost/api/auth/me", { headers: authHeader(token) })
    );

    expect(res.status).toBe(401);
  });
});
