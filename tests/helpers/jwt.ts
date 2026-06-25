import { Elysia } from "elysia";
import { jwtPlugin } from "@/backend/plugins/auth";

/** Signs a token with the app's real jwt plugin/secret, without touching the db. */
export async function signTestToken(payload: { id: string; email: string }): Promise<string> {
  const app = new Elysia()
    .use(jwtPlugin)
    .get("/sign", ({ jwt }) => jwt.sign(payload));

  const res = await app.handle(new Request("http://localhost/sign"));
  return res.text();
}

export function authHeader(token: string): Record<string, string> {
  return { cookie: `token=${token}` };
}
