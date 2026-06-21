import { Elysia } from "elysia";
import { db } from "../db";
import { jwtPlugin, COOKIE_MAX_AGE } from "../plugins/auth";
import { getUserById } from "./users";
import { UserSchema } from "@/storage/schemas.ts";
import { validateResponse } from "../validateResponse";

export const authRoutes = new Elysia({ prefix: "/api/auth" })
  .use(jwtPlugin)

  // Register — creates the user and sets the httpOnly cookie
  .post("/register", async ({ jwt, cookie, body, set }) => {
    const { email, password } = body as { email: string; password: string };

    if (!email || !password) {
      set.status = 400;
      return { error: "Email and password are required" };
    }

    try {
      const hashed = await Bun.password.hash(password);

      const [params] = await db`
        INSERT INTO parameters DEFAULT VALUES RETURNING id
      `;

      const [user] = await db`
        INSERT INTO users (email, password, parameters_id)
        VALUES (${email}, ${hashed}, ${params.id})
        RETURNING id, email
      `;

      const token = await jwt.sign({ id: user.id, email: user.email });
      cookie.token!.set({
        value: token,
        httpOnly: true,
        maxAge: COOKIE_MAX_AGE,
        sameSite: "lax",
        path: "/",
      });

      set.status = 201;
      return validateResponse(UserSchema, await getUserById(user.id));
    } catch (err: any) {
      if (err.code === "23505") {
        set.status = 409;
        return { error: "Email already in use" };
      }
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  // Login — verifies credentials and sets the httpOnly cookie
  .post("/login", async ({ jwt, cookie, body, set }) => {
    const { email, password } = body as { email: string; password: string };

    if (!email || !password) {
      set.status = 400;
      return { error: "Email and password are required" };
    }

    try {
      const [user] = await db`
        SELECT id, email, password, parameters_id
        FROM users
        WHERE email = ${email}
      `;

      if (!user) {
        set.status = 401;
        return { error: "Invalid credentials" };
      }

      const valid = await Bun.password.verify(password, user.password);
      if (!valid) {
        set.status = 401;
        return { error: "Invalid credentials" };
      }

      const token = await jwt.sign({ id: user.id, email: user.email });
      cookie.token!.set({
        value: token,
        httpOnly: true,
        maxAge: COOKIE_MAX_AGE,
        sameSite: "lax",
        path: "/",
      });

      return validateResponse(UserSchema, await getUserById(user.id));
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  // Logout — removes the cookie
  .post("/logout", ({ cookie }) => {
    cookie.token!.set({
      value: "",
      httpOnly: true,
      maxAge: 0,
      sameSite: "lax",
      path: "/",
    });
    return { message: "Logged out" };
  })

  // Check auth state — the frontend calls this on startup
  // Returns { id, email, parameters } if logged in, 401 otherwise
  .get("/me", async ({ jwt, cookie, set }) => {
    const token = cookie.token?.value as string | undefined;
    if (!token) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const payload = await jwt.verify(token);
    if (!payload) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    try {
      const user = await getUserById((payload as any).id);
      if (!user) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
      return validateResponse(UserSchema, user);
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  });
