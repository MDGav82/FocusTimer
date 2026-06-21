import { Elysia } from "elysia";
import { db } from "../db";
import { requireAuth } from "../plugins/auth";

// Index matches the frontend Status enum (PENDING=0, PROGRESS=1, FINISHED=2)
const STATUS_NAMES = ["pending", "progress", "finish"];

function toTaskJson(row: any) {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description,
    estimatedTime: row.estimated_time,
    progress: row.progress,
    timeSpent: row.time_spent,
    creationDate: row.creation_date,
    startDate: row.start_date,
    endDate: row.end_date,
    status: STATUS_NAMES.indexOf(row.status_name),
  };
}

async function getTaskById(id: string) {
  const [row] = await db`
    SELECT t.id, t.user_id, t.title, t.description, t.estimated_time, t.progress,
           t.time_spent, t.creation_date, t.start_date, t.end_date, s.name AS status_name
    FROM task t
    JOIN status s ON s.id = t.status_id
    WHERE t.id = ${id}
  `;
  return row ? toTaskJson(row) : null;
}

export const taskRoutes = new Elysia()
  .use(requireAuth)

  .get("/api/users/:id/tasks", async ({ params: { id }, set }) => {
    try {
      const rows = await db`
        SELECT t.id, t.user_id, t.title, t.description, t.estimated_time, t.progress,
               t.time_spent, t.creation_date, t.start_date, t.end_date, s.name AS status_name
        FROM task t
        JOIN status s ON s.id = t.status_id
        WHERE t.user_id = ${id}
        ORDER BY t.creation_date DESC
      `;
      return rows.map(toTaskJson);
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .post("/api/users/:id/tasks", async ({ params: { id }, body, set }) => {
    const { id: taskId, title, description, estimatedTime } = body as any;
    if (!title) { set.status = 400; return { error: "Title is required" }; }
    try {
      const [task] = await db`
        INSERT INTO task (id, user_id, status_id, title, description, estimated_time)
        VALUES (
          COALESCE(${taskId ?? null}, gen_random_uuid()),
          ${id},
          (SELECT id FROM status WHERE name = 'pending'),
          ${title},
          ${description ?? null},
          ${estimatedTime ?? 0}
        )
        RETURNING id
      `;
      set.status = 201;
      return await getTaskById(task.id);
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .get("/api/tasks/:id", async ({ params: { id }, set }) => {
    try {
      const task = await getTaskById(id);
      if (!task) { set.status = 404; return { error: "Task not found" }; }
      return task;
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .put("/api/tasks/:id", async ({ params: { id }, body, set }) => {
    const {
      title, description, status, estimatedTime,
      progress, timeSpent, startDate, endDate,
    } = body as any;
    const statusName = typeof status === "number" ? STATUS_NAMES[status] : undefined;
    try {
      const [updated] = await db`
        UPDATE task
        SET
          title          = COALESCE(${title ?? null}, title),
          description    = COALESCE(${description ?? null}, description),
          status_id      = COALESCE((SELECT id FROM status WHERE name = ${statusName ?? null}), status_id),
          estimated_time = COALESCE(${estimatedTime ?? null}, estimated_time),
          progress       = COALESCE(${progress ?? null}, progress),
          time_spent     = COALESCE(${timeSpent ?? null}, time_spent),
          start_date     = COALESCE(${startDate ?? null}, start_date),
          end_date       = COALESCE(${endDate ?? null}, end_date)
        WHERE id = ${id}
        RETURNING id
      `;
      if (!updated) { set.status = 404; return { error: "Task not found" }; }
      return await getTaskById(id);
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
