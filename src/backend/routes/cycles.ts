import { Elysia } from "elysia";
import { db } from "../db";
import { requireAuth } from "../plugins/auth";
import { CycleCreateSchema,CycleUpdateSchema, CycleSchema, PeriodSchema, PeriodInputSchema } from "@/model/schemas.ts";
import { validateResponse, validateResponseList } from "../validateResponse";

// Index matches the frontend PeriodType enum (WORK=0, REST=1)
const PERIOD_TYPE_NAMES = ["work", "break"];


// Maps the persisted `updated_at` (epoch ms) to `updatedAt` and stamps the
// client-only `_syncStatus`, dropping the snake_case column from the response.
function withSyncMeta<T extends { updated_at?: unknown }>(row: T) {
  const { updated_at, ...rest } = row as any;
  return { ...rest, updatedAt: Number(updated_at), _syncStatus: "synced" };
}

function toPeriodJson(row: any) {
  return withSyncMeta({
    id: row.id,
    cycle_id: row.cycle_id,
    time: row.time,
    index: row.index,
    typePeriode: PERIOD_TYPE_NAMES.indexOf(row.type_name),
    updated_at: row.updated_at,
  });
}

// Periods are owned transitively through their parent cycle, so every lookup is
// scoped to the authenticated user's cycles to prevent cross-user access (IDOR).
async function getPeriodById(id: string, userId: string) {
  const [row] = await db`
    SELECT p.id, p.cycle_id, p.time, p.index, p.updated_at, tp.name AS type_name
    FROM period p
    JOIN type_periode tp ON tp.id = p.type_periode_id
    JOIN cycle c ON c.id = p.cycle_id
    WHERE p.id = ${id} AND c.user_id = ${userId}
  `;
  return row ? toPeriodJson(row) : null;
}

// Scoped to the owner: a cycle is only ever returned to the user it belongs to.
async function getCycleById(id: string, userId: string) {
  const [cycle] = await db`SELECT id, user_id, name, updated_at FROM cycle WHERE id = ${id} AND user_id = ${userId}`;
  return cycle ? withSyncMeta(cycle) : null;
}

export const cycleRoutes = new Elysia()
  .use(requireAuth)

  .get("/api/users/:id/cycles", async ({ params: { id }, user, set }) => {
    if (user!.id !== id) { set.status = 403; return { error: "Forbidden" }; }
    try {
      const cycles = await db`
        SELECT id, user_id, name, updated_at FROM cycle WHERE user_id = ${id} ORDER BY id ASC
      `;
      return validateResponseList(CycleSchema, cycles.map(withSyncMeta));
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .post("/api/users/:id/cycles", async ({ params: { id }, body, user, set }) => {
    if (user!.id !== id) { set.status = 403; return { error: "Forbidden" }; }
    const { id: cycleId, name } = body;
    try {
      const [cycle] = await db`
        INSERT INTO cycle (id, user_id, name)
        VALUES (COALESCE(${cycleId ?? null}, gen_random_uuid()), ${id}, ${name})
        RETURNING id, user_id, name, updated_at
      `;
      set.status = 201;
      return validateResponse(CycleSchema, withSyncMeta(cycle));
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  }, {body: CycleCreateSchema})

  .get("/api/cycles/:id", async ({ params: { id }, user, set }) => {
    try {
      const cycle = await getCycleById(id, user!.id);
      if (!cycle) { set.status = 404; return { error: "Cycle not found" }; }
      return validateResponse(CycleSchema, cycle);
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .put("/api/cycles/:id", async ({ params: { id }, body, user, set }) => {
    const { name } = body;
    try {
      if (name !== undefined) {
        const [updated] = await db`
          UPDATE cycle
          SET name = ${name}, updated_at = (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
          WHERE id = ${id} AND user_id = ${user!.id} RETURNING id
        `;
        if (!updated) { set.status = 404; return { error: "Cycle not found" }; }
      }
      const result = await getCycleById(id, user!.id);
      if (!result) { set.status = 404; return { error: "Cycle not found" }; }
      return validateResponse(CycleSchema, result);
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  }, {body:CycleUpdateSchema})

  .delete("/api/cycles/:id", async ({ params: { id }, user, set }) => {
    try {
      const [deleted] = await db`DELETE FROM cycle WHERE id = ${id} AND user_id = ${user!.id} RETURNING id`;
      if (!deleted) { set.status = 404; return { error: "Cycle not found" }; }
      set.status = 204;
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .get("/api/cycles/:id/periods", async ({ params: { id }, user, set }) => {
    try {
      const [cycle] = await db`SELECT id FROM cycle WHERE id = ${id} AND user_id = ${user!.id}`;
      if (!cycle) { set.status = 404; return { error: "Cycle not found" }; }
      const periods = await db`
        SELECT p.id, p.cycle_id, p.time, p.index, p.updated_at, tp.name AS type_name
        FROM period p
        JOIN type_periode tp ON tp.id = p.type_periode_id
        WHERE p.cycle_id = ${id}
        ORDER BY p.index ASC
      `;
      return validateResponseList(PeriodSchema, periods.map(toPeriodJson));
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .post("/api/cycles/:id/periods", async ({ params: { id }, body, user, set }) => {
    const { id: periodId, typePeriode, time, index } = body;
    try {
      // INSERT ... SELECT ... WHERE EXISTS so the period is only created when the
      // parent cycle belongs to the caller; otherwise zero rows are inserted.
      const [period] = await db`
        INSERT INTO period (id, cycle_id, type_periode_id, time, index)
        SELECT
          COALESCE(${periodId ?? null}, gen_random_uuid()),
          ${id},
          (SELECT id FROM type_periode WHERE name = ${PERIOD_TYPE_NAMES[typePeriode]}),
          ${time}, ${index}
        WHERE EXISTS (SELECT 1 FROM cycle WHERE id = ${id} AND user_id = ${user!.id})
        RETURNING id
      `;
      if (!period) { set.status = 404; return { error: "Cycle not found" }; }
      set.status = 201;
      return validateResponse(PeriodSchema, await getPeriodById(period.id, user!.id));
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  }, {body: PeriodInputSchema})

  .get("/api/periods/:id", async ({ params: { id }, user, set }) => {
    try {
      const period = await getPeriodById(id, user!.id);
      if (!period) { set.status = 404; return { error: "Period not found" }; }
      return validateResponse(PeriodSchema, period);
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .put("/api/periods/:id", async ({ params: { id }, body, user, set }) => {
    const { typePeriode, time, index } = body as any;
    const typeName = typeof typePeriode === "number" ? PERIOD_TYPE_NAMES[typePeriode] : undefined;
    try {
      const [updated] = await db`
        UPDATE period
        SET
          type_periode_id = COALESCE((SELECT id FROM type_periode WHERE name = ${typeName ?? null}), type_periode_id),
          time            = COALESCE(${time ?? null}, time),
          index           = COALESCE(${index ?? null}, index),
          updated_at      = (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
        WHERE id = ${id}
          AND cycle_id IN (SELECT id FROM cycle WHERE user_id = ${user!.id})
        RETURNING id
      `;
      if (!updated) { set.status = 404; return { error: "Period not found" }; }
      return validateResponse(PeriodSchema, await getPeriodById(id, user!.id));
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .delete("/api/periods/:id", async ({ params: { id }, user, set }) => {
    try {
      const [deleted] = await db`
        DELETE FROM period
        WHERE id = ${id} AND cycle_id IN (SELECT id FROM cycle WHERE user_id = ${user!.id})
        RETURNING id
      `;
      if (!deleted) { set.status = 404; return { error: "Period not found" }; }
      set.status = 204;
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  });
