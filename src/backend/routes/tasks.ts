import { Elysia } from "elysia";
import { db } from "../db";
import { requireAuth } from "../plugins/auth";
import {TaskCreateSchema,TaskUpdateSchema, TaskSchema } from "@/model/schemas.ts";
import { validateResponse, validateResponseList } from "../validateResponse";
import { log } from "../logger";

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
    updatedAt: Number(row.updated_at),
    _syncStatus: "synced",
  };
}

// Scoped to the owner so a task is only ever returned to the user it belongs to.
async function getTaskById(id: string, userId: string) {
  const [row] = await db`
    SELECT t.id, t.user_id, t.title, t.description, t.estimated_time, t.progress,
           t.time_spent, t.creation_date, t.start_date, t.end_date, t.updated_at,
           s.name AS status_name
    FROM task t
    JOIN status s ON s.id = t.status_id
    WHERE t.id = ${id} AND t.user_id = ${userId}
  `;
  return row ? toTaskJson(row) : null;
}

export const taskRoutes = new Elysia()
  .use(requireAuth)

  .get("/api/users/:id/tasks", async ({ params: { id }, user, set }) => {
    if (user!.id !== id) { set.status = 403; return { error: "Forbidden" }; }
    try {
      const rows = await db`
        SELECT t.id, t.user_id, t.title, t.description, t.estimated_time, t.progress,
               t.time_spent, t.creation_date, t.start_date, t.end_date, t.updated_at,
               s.name AS status_name
        FROM task t
        JOIN status s ON s.id = t.status_id
        WHERE t.user_id = ${id}
        ORDER BY t.creation_date DESC
      `;
      return validateResponseList(TaskSchema, rows.map(toTaskJson));
    } catch (err) {
      log.error("Request handler failed", err);
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .post("/api/users/:id/tasks", async ({ params: { id }, body, user, set }) => {
    if (user!.id !== id) { set.status = 403; return { error: "Forbidden" }; }
    const { id: taskId, title, description, estimatedTime } = body;
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
      return validateResponse(TaskSchema, await getTaskById(task.id, user!.id));
    } catch (err) {
      log.error("Request handler failed", err);
      set.status = 500;
      return { error: "Internal server error" };
    }
  }, {body:TaskCreateSchema})

  .get("/api/tasks/:id", async ({ params: { id }, user, set }) => {
    try {
      const task = await getTaskById(id, user!.id);
      if (!task) { set.status = 404; return { error: "Task not found" }; }
      return validateResponse(TaskSchema, task);
    } catch (err) {
      log.error("Request handler failed", err);
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .put("/api/tasks/:id", async ({ params: { id }, body, user, set }) => {
    const {
      title, description, status, estimatedTime,
      progress, timeSpent, startDate, endDate,
    } = body;
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
          end_date       = COALESCE(${endDate ?? null}, end_date),
          updated_at     = (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
        WHERE id = ${id} AND user_id = ${user!.id}
        RETURNING id
      `;
      if (!updated) { set.status = 404; return { error: "Task not found" }; }
      return validateResponse(TaskSchema, await getTaskById(id, user!.id));
    } catch (err) {
      log.error("Request handler failed", err);
      set.status = 500;
      return { error: "Internal server error" };
    }
  }, {body: TaskUpdateSchema})

  .delete("/api/tasks/:id", async ({ params: { id }, user, set }) => {
    try {
      const [deleted] = await db`DELETE FROM task WHERE id = ${id} AND user_id = ${user!.id} RETURNING id`;
      if (!deleted) { set.status = 404; return { error: "Task not found" }; }
      set.status = 204;
    } catch (err) {
      log.error("Request handler failed", err);
      set.status = 500;
      return { error: "Internal server error" };
    }
  });
