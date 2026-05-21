import { Elysia } from "elysia";
import { db } from "../db";
import { requireAuth } from "../plugins/auth";

type PeriodInput = { type_periode_id: number; time: number; index: number };

async function getCycleWithPeriods(cycleId: number | string) {
  const [cycle] = await db`SELECT id, user_id, name FROM cycle WHERE id = ${cycleId}`;
  if (!cycle) return null;

  const periods = await db`
    SELECT p.id, p.time, p.index, p.type_periode_id, tp.name AS type_name
    FROM period p
    JOIN type_periode tp ON tp.id = p.type_periode_id
    WHERE p.cycle_id = ${cycleId}
    ORDER BY p.index ASC
  `;
  return { ...cycle, periods };
}

export const cycleRoutes = new Elysia()
  .use(requireAuth)

  .get("/api/users/:userId/cycles", async ({ params: { userId }, set }) => {
    try {
      const cycles = await db`
        SELECT id, name FROM cycle WHERE user_id = ${userId} ORDER BY id ASC
      `;
      return await Promise.all(cycles.map((c: { id: number }) => getCycleWithPeriods(c.id)));
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .post("/api/users/:userId/cycles", async ({ params: { userId }, body, set }) => {
    const { name, periods } = body as any;
    if (!name) { set.status = 400; return { error: "Name is required" }; }
    try {
      const [cycle] = await db`
        INSERT INTO cycle (user_id, name) VALUES (${userId}, ${name}) RETURNING id, name
      `;
      if (Array.isArray(periods) && periods.length > 0) {
        for (const p of periods as PeriodInput[]) {
          await db`
            INSERT INTO period (cycle_id, type_periode_id, time, index)
            VALUES (${cycle.id}, ${p.type_periode_id}, ${p.time}, ${p.index})
          `;
        }
      }
      set.status = 201;
      return await getCycleWithPeriods(cycle.id);
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .get("/api/cycles/:id", async ({ params: { id }, set }) => {
    try {
      const cycle = await getCycleWithPeriods(id);
      if (!cycle) { set.status = 404; return { error: "Cycle not found" }; }
      return cycle;
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .put("/api/cycles/:id", async ({ params: { id }, body, set }) => {
    const { name, periods } = body as any;
    try {
      if (name !== undefined) {
        const [updated] = await db`
          UPDATE cycle SET name = ${name} WHERE id = ${id} RETURNING id
        `;
        if (!updated) { set.status = 404; return { error: "Cycle not found" }; }
      }
      if (Array.isArray(periods)) {
        await db`DELETE FROM period WHERE cycle_id = ${id}`;
        for (const p of periods as PeriodInput[]) {
          await db`
            INSERT INTO period (cycle_id, type_periode_id, time, index)
            VALUES (${id}, ${p.type_periode_id}, ${p.time}, ${p.index})
          `;
        }
      }
      const result = await getCycleWithPeriods(id);
      if (!result) { set.status = 404; return { error: "Cycle not found" }; }
      return result;
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .delete("/api/cycles/:id", async ({ params: { id }, set }) => {
    try {
      const [deleted] = await db`DELETE FROM cycle WHERE id = ${id} RETURNING id`;
      if (!deleted) { set.status = 404; return { error: "Cycle not found" }; }
      set.status = 204;
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .get("/api/cycles/:cycleId/periods", async ({ params: { cycleId }, set }) => {
    try {
      const [cycle] = await db`SELECT id FROM cycle WHERE id = ${cycleId}`;
      if (!cycle) { set.status = 404; return { error: "Cycle not found" }; }
      return await db`
        SELECT p.id, p.time, p.index, p.type_periode_id, tp.name AS type_name
        FROM period p
        JOIN type_periode tp ON tp.id = p.type_periode_id
        WHERE p.cycle_id = ${cycleId}
        ORDER BY p.index ASC
      `;
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .post("/api/cycles/:cycleId/periods", async ({ params: { cycleId }, body, set }) => {
    const { type_periode_id, time, index } = body as any;
    if (type_periode_id === undefined || time === undefined || index === undefined) {
      set.status = 400;
      return { error: "type_periode_id, time and index are required" };
    }
    try {
      const [period] = await db`
        INSERT INTO period (cycle_id, type_periode_id, time, index)
        VALUES (${cycleId}, ${type_periode_id}, ${time}, ${index})
        RETURNING *
      `;
      set.status = 201;
      return period;
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .get("/api/periods/:id", async ({ params: { id }, set }) => {
    try {
      const [period] = await db`
        SELECT p.id, p.cycle_id, p.time, p.index, p.type_periode_id, tp.name AS type_name
        FROM period p
        JOIN type_periode tp ON tp.id = p.type_periode_id
        WHERE p.id = ${id}
      `;
      if (!period) { set.status = 404; return { error: "Period not found" }; }
      return period;
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .put("/api/periods/:id", async ({ params: { id }, body, set }) => {
    const { type_periode_id, time, index } = body as any;
    try {
      const [period] = await db`
        UPDATE period
        SET
          type_periode_id = COALESCE(${type_periode_id ?? null}, type_periode_id),
          time            = COALESCE(${time ?? null}, time),
          index           = COALESCE(${index ?? null}, index)
        WHERE id = ${id}
        RETURNING *
      `;
      if (!period) { set.status = 404; return { error: "Period not found" }; }
      return period;
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .delete("/api/periods/:id", async ({ params: { id }, set }) => {
    try {
      const [deleted] = await db`DELETE FROM period WHERE id = ${id} RETURNING id`;
      if (!deleted) { set.status = 404; return { error: "Period not found" }; }
      set.status = 204;
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  });
