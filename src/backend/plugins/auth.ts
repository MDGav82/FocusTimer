import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET environment variable is not set");
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export const jwtPlugin = new Elysia({ name: "jwt-plugin" })
.use(
  jwt({ 
    name: "jwt", 
    secret: JWT_SECRET 
  })
);

// Plugin to use on all protected routes
// Verifies the httpOnly cookie and returns 401 if missing or invalid
export const requireAuth = new Elysia({ name: "pomodoro" })
  .use(jwtPlugin)
  .derive({ as: "scoped" }, async ({ jwt, cookie }) => {
    const token = (cookie.token?.value as string) ?? "";
    const payload = token ? await jwt.verify(token) : false;
    return {
      user: (payload || null) as { id: number; email: string } | null,
    };
  })
  .onBeforeHandle({ as: "scoped" }, ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  });
