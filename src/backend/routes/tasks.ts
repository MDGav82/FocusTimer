import { Elysia } from "elysia";
import { db } from "../db";
import { requireAuth } from "../plugins/auth";

export const taskRoutes = new Elysia()
  .use(requireAuth)

  .get("/api/users/:userId/tasks", async ({ params: { userId }, set }) => {
    try {
      return await db`
        SELECT t.*, s.name AS status_name
        FROM task t
        JOIN status s ON s.id = t.status_id
        WHERE t.user_id = ${userId}
        ORDER BY t.creation_date DESC
      `;
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .post("/api/users/:userId/tasks", async ({ params: { userId }, body, set }) => {
    const { title, description, estimated_time } = body as any;
    if (!title) { set.status = 400; return { error: "Title is required" }; }
    try {
      const [task] = await db`
        INSERT INTO task (user_id, status_id, title, description, estimated_time)
        VALUES (
          ${userId},
          (SELECT id FROM status WHERE name = 'pending'),
          ${title},
          ${description ?? null},
          ${estimated_time ?? 0}
        )
        RETURNING *
      `;
      set.status = 201;
      return task;
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .get("/api/tasks/:id", async ({ params: { id }, set }) => {
    try {
      const [task] = await db`
        SELECT t.*, s.name AS status_name
        FROM task t
        JOIN status s ON s.id = t.status_id
        WHERE t.id = ${id}
      `;
      if (!task) { set.status = 404; return { error: "Task not found" }; }
      return task;
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .put("/api/tasks/:id", async ({ params: { id }, body, set }) => {
    const {
      title, description, status_id, estimated_time,
      progress, time_spent, start_date, end_date,
    } = body as any;
    try {
      const [task] = await db`
        UPDATE task
        SET
          title          = COALESCE(${title ?? null}, title),
          description    = COALESCE(${description ?? null}, description),
          status_id      = COALESCE(${status_id ?? null}, status_id),
          estimated_time = COALESCE(${estimated_time ?? null}, estimated_time),
          progress       = COALESCE(${progress ?? null}, progress),
          time_spent     = COALESCE(${time_spent ?? null}, time_spent),
          start_date     = COALESCE(${start_date ?? null}, start_date),
          end_date       = COALESCE(${end_date ?? null}, end_date)
        WHERE id = ${id}
        RETURNING *
      `;
      if (!task) { set.status = 404; return { error: "Task not found" }; }
      return task;
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .delete("/api/tasks/:id", async ({ params: { id }, set }) => {
    try {
      const [deleted] = await db`DELETE FROM task WHERE id = ${id} RETURNING id`;
      if (!deleted) { set.status = 404; return { error: "Task not found" }; }
      set.status = 204;
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  });
