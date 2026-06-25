import { describe, it, expect } from "bun:test";
import { Elysia } from "elysia";
import { requireAuth } from "@/backend/plugins/auth";
import { signTestToken, authHeader } from "../../helpers/jwt";

function buildApp() {
  return new Elysia()
    .use(requireAuth)
    .get("/protected", ({ user }) => ({ user }));
}

describe("requireAuth", () => {
  it("rejects with 401 when there is no cookie", async () => {
    const app = buildApp();
    const res = await app.handle(new Request("http://localhost/protected"));
    expect(res.status).toBe(401);
  });

  it("rejects with 401 when the token is invalid", async () => {
    const app = buildApp();
    const res = await app.handle(
      new Request("http://localhost/protected", { headers: authHeader("not-a-real-token") })
    );
    expect(res.status).toBe(401);
  });

  it("lets the request through and exposes the user when the token is valid", async () => {
    const token = await signTestToken({ id: "user-1", email: "a@b.com" });
    const app = buildApp();
    const res = await app.handle(
      new Request("http://localhost/protected", { headers: authHeader(token) })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toMatchObject({ id: "user-1", email: "a@b.com" });
  });
});
