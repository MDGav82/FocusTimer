import { Elysia } from "elysia";
import { db } from "../db";
import { requireAuth } from "../plugins/auth";
import { UserSchema } from "@/model/schemas.ts";
import { validateResponse, validateResponseList } from "../validateResponse";

export function toUserJson(row: any) {
  return {
    id: row.id,
    email: row.email,
    parameters: {
      id: String(row.parameters_id),
      autoStartWork: row.auto_start_work,
      autoStartRest: row.auto_start_rest,
      autoRestartCycle: row.auto_restart_cycle,
      notificationsOn: row.notifications_on,
      updatedAt: Number(row.parameters_updated_at),
      _syncStatus: "synced",
    },
    updatedAt: Number(row.updated_at),
    _syncStatus: "synced",
  };
}

export async function getUserById(id: string) {
  const [row] = await db`
    SELECT u.id, u.email, u.parameters_id, u.updated_at,
      p.auto_start_work, p.auto_start_rest,
      p.auto_restart_cycle, p.notifications_on,
      p.updated_at AS parameters_updated_at
    FROM users u
    JOIN parameters p ON p.id = u.parameters_id
    WHERE u.id = ${id}
  `;
  return row ? toUserJson(row) : null;
}

export const userRoutes = new Elysia()
  .use(requireAuth)

  .get("/api/users", async ({ set }) => {
    try {
      const rows = await db`
        SELECT u.id, u.email, u.parameters_id, u.updated_at,
          p.auto_start_work, p.auto_start_rest,
          p.auto_restart_cycle, p.notifications_on,
          p.updated_at AS parameters_updated_at
        FROM users u
        JOIN parameters p ON p.id = u.parameters_id
        ORDER BY u.id ASC
      `;
      return validateResponseList(UserSchema, rows.map(toUserJson));
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .get("/api/users/:id", async ({ params: { id }, set }) => {
    try {
      const user = await getUserById(id);
      if (!user) { set.status = 404; return { error: "User not found" }; }
      return validateResponse(UserSchema, user);
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .put("/api/users/:id", async ({ params: { id }, body, set }) => {
    const { email, password } = body as { email?: string; password?: string };
    try {
      const hashed = password ? await Bun.password.hash(password) : null;
      const [updated] = await db`
        UPDATE users
        SET
          email      = COALESCE(${email ?? null}, email),
          password   = COALESCE(${hashed}, password),
          updated_at = (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
        WHERE id = ${id}
        RETURNING id
      `;
      if (!updated) { set.status = 404; return { error: "User not found" }; }
      return validateResponse(UserSchema, await getUserById(id));
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
    const { autoStartWork, autoStartRest, autoRestartCycle, notificationsOn } =
      body as any;
    try {
      const [updated] = await db`
        UPDATE parameters p
        SET
          auto_start_work    = COALESCE(${autoStartWork ?? null}, p.auto_start_work),
          auto_start_rest    = COALESCE(${autoStartRest ?? null}, p.auto_start_rest),
          auto_restart_cycle = COALESCE(${autoRestartCycle ?? null}, p.auto_restart_cycle),
          notifications_on   = COALESCE(${notificationsOn ?? null}, p.notifications_on),
          updated_at         = (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
        FROM users u
        WHERE u.parameters_id = p.id AND u.id = ${id}
        RETURNING u.id
      `;
      if (!updated) { set.status = 404; return { error: "User not found" }; }
      return validateResponse(UserSchema, await getUserById(updated.id));
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  });
