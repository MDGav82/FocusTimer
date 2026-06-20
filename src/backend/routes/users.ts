import { Elysia } from "elysia";
import { db } from "../db";
import { requireAuth } from "../plugins/auth";

export const userRoutes = new Elysia()
  .use(requireAuth)

  .get("/api/users", async ({ set }) => {
    try {
      return await db`SELECT id, email, parameters_id FROM users ORDER BY id ASC`;
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .get("/api/users/:id", async ({ params: { id }, set }) => {
    try {
      const [user] = await db`
        SELECT u.id, u.email, u.parameters_id,
          p.auto_start_work, p.auto_start_rest,
          p.auto_restart_cycle, p.notifications_on
        FROM users u
        JOIN parameters p ON p.id = u.parameters_id
        WHERE u.id = ${id}
      `;
      if (!user) { set.status = 404; return { error: "User not found" }; }
      return user;
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .put("/api/users/:id", async ({ params: { id }, body, set }) => {
    const { email, password } = body as { email?: string; password?: string };
    try {
      const hashed = password ? await Bun.password.hash(password) : null;
      const [user] = await db`
        UPDATE users
        SET
          email    = COALESCE(${email ?? null}, email),
          password = COALESCE(${hashed}, password)
        WHERE id = ${id}
        RETURNING id, email, parameters_id
      `;
      if (!user) { set.status = 404; return { error: "User not found" }; }
      return user;
    } catch (err: any) {
      if (err.code === "23505") { set.status = 409; return { error: "Email already in use" }; }
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .delete("/api/users/:id", async ({ params: { id }, set }) => {
    try {
      const [deleted] = await db`DELETE FROM users WHERE id = ${id} RETURNING id`;
      if (!deleted) { set.status = 404; return { error: "User not found" }; }
      set.status = 204;
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .put("/api/users/:id/parameters", async ({ params: { id }, body, set }) => {
    const { auto_start_work, auto_start_rest, auto_restart_cycle, notifications_on } =
      body as any;
    try {
      const [updated] = await db`
        UPDATE parameters p
        SET
          auto_start_work    = COALESCE(${auto_start_work ?? null}, p.auto_start_work),
          auto_start_rest    = COALESCE(${auto_start_rest ?? null}, p.auto_start_rest),
          auto_restart_cycle = COALESCE(${auto_restart_cycle ?? null}, p.auto_restart_cycle),
          notifications_on   = COALESCE(${notifications_on ?? null}, p.notifications_on)
        FROM users u
        WHERE u.parameters_id = p.id AND u.id = ${id}
        RETURNING p.*
      `;
      if (!updated) { set.status = 404; return { error: "User not found" }; }
      return updated;
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })
