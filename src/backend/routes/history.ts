import { Elysia } from "elysia";
import { db } from "../db";
import { requireAuth } from "../plugins/auth";

export const historyRoutes = new Elysia()
  .use(requireAuth)

  .get("/api/users/:userId/history", async ({ params: { userId }, set }) => {
    try {
      return await db`
        SELECT
          h.id, h.start_date, h.time_spent,
          tp.name AS type_name,
          t.title AS task_title,
          c.name  AS cycle_name
        FROM history h
        JOIN type_periode tp ON tp.id = h.type_periode_id
        JOIN cycle c         ON c.id  = h.cycle_id
        LEFT JOIN task t     ON t.id  = h.task_id
        WHERE h.user_id = ${userId}
        ORDER BY h.start_date DESC
      `;
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .post("/api/users/:userId/history", async ({ params: { userId }, body, set }) => {
    const { type_periode_id, cycle_id, task_id, time_spent } = body as any;
    if (!type_periode_id || !cycle_id) {
      set.status = 400;
      return { error: "type_periode_id and cycle_id are required" };
    }
    try {
      const [entry] = await db`
        INSERT INTO history (user_id, type_periode_id, cycle_id, task_id, time_spent)
        VALUES (
          ${userId}, ${type_periode_id}, ${cycle_id},
          ${task_id ?? null}, ${time_spent ?? 0}
        )
        RETURNING *
      `;
      set.status = 201;
      return entry;
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .get("/api/history/:id", async ({ params: { id }, set }) => {
    try {
      const [entry] = await db`
        SELECT
          h.id, h.start_date, h.time_spent,
          tp.name AS type_name,
          t.title  AS task_title,
          c.name   AS cycle_name
        FROM history h
        JOIN type_periode tp ON tp.id = h.type_periode_id
        JOIN cycle c         ON c.id  = h.cycle_id
        LEFT JOIN task t     ON t.id  = h.task_id
        WHERE h.id = ${id}
      `;
      if (!entry) { set.status = 404; return { error: "History entry not found" }; }
      return entry;
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .put("/api/history/:id", async ({ params: { id }, body, set }) => {
    const { type_periode_id, cycle_id, task_id, time_spent } = body as any;
    try {
      const [entry] = await db`
        UPDATE history
        SET
          type_periode_id = COALESCE(${type_periode_id ?? null}, type_periode_id),
          cycle_id        = COALESCE(${cycle_id ?? null}, cycle_id),
          task_id         = COALESCE(${task_id ?? null}, task_id),
          time_spent      = COALESCE(${time_spent ?? null}, time_spent)
        WHERE id = ${id}
        RETURNING *
      `;
      if (!entry) { set.status = 404; return { error: "History entry not found" }; }
      return entry;
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .delete("/api/history/:id", async ({ params: { id }, set }) => {
    try {
      const [deleted] = await db`DELETE FROM history WHERE id = ${id} RETURNING id`;
      if (!deleted) { set.status = 404; return { error: "History entry not found" }; }
      set.status = 204;
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  });
