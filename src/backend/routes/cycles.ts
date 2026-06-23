import { Elysia } from "elysia";
import { db } from "../db";
import { requireAuth } from "../plugins/auth";
import { CycleSchema, PeriodSchema } from "@/model/schemas.ts";
import { validateResponse, validateResponseList } from "../validateResponse";

// Index matches the frontend PeriodType enum (WORK=0, REST=1)
const PERIOD_TYPE_NAMES = ["work", "break"];

type PeriodInput = { typePeriode: number; time: number; index: number };

function toPeriodJson(row: any) {
  return {
    id: row.id,
    cycle_id: row.cycle_id,
    time: row.time,
    index: row.index,
    typePeriode: PERIOD_TYPE_NAMES.indexOf(row.type_name),
  };
}

async function getPeriodById(id: string) {
  const [row] = await db`
    SELECT p.id, p.cycle_id, p.time, p.index, tp.name AS type_name
    FROM period p
    JOIN type_periode tp ON tp.id = p.type_periode_id
    WHERE p.id = ${id}
  `;
  return row ? toPeriodJson(row) : null;
}

async function getCycleWithPeriods(id: string) {
  const [cycle] = await db`SELECT id, user_id, name FROM cycle WHERE id = ${id}`;
  if (!cycle) return null;

  const periods = await db`
    SELECT p.id, p.cycle_id, p.time, p.index, tp.name AS type_name
    FROM period p
    JOIN type_periode tp ON tp.id = p.type_periode_id
    WHERE p.cycle_id = ${id}
    ORDER BY p.index ASC
  `;
  return { ...cycle, periods: periods.map(toPeriodJson) };
}

export const cycleRoutes = new Elysia()
  .use(requireAuth)

  .get("/api/users/:id/cycles", async ({ params: { id }, set }) => {
    try {
      const cycles = await db`
        SELECT id, name FROM cycle WHERE user_id = ${id} ORDER BY id ASC
      `;
      const result = await Promise.all(cycles.map((c: { id: string }) => getCycleWithPeriods(c.id)));
      return validateResponseList(CycleSchema, result);
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .post("/api/users/:id/cycles", async ({ params: { id }, body, set }) => {
    const { id: cycleId, name, periods } = body as any;
    if (!name) { set.status = 400; return { error: "Name is required" }; }
    try {
      const [cycle] = await db`
        INSERT INTO cycle (id, user_id, name)
        VALUES (COALESCE(${cycleId ?? null}, gen_random_uuid()), ${id}, ${name})
        RETURNING id, name
      `;
      if (Array.isArray(periods) && periods.length > 0) {
        for (const p of periods as PeriodInput[]) {
          await db`
            INSERT INTO period (cycle_id, type_periode_id, time, index)
            VALUES (${cycle.id}, (SELECT id FROM type_periode WHERE name = ${PERIOD_TYPE_NAMES[p.typePeriode]}), ${p.time}, ${p.index})
          `;
        }
      }
      set.status = 201;
      return validateResponse(CycleSchema, await getCycleWithPeriods(cycle.id));
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .get("/api/cycles/:id", async ({ params: { id }, set }) => {
    try {
      const cycle = await getCycleWithPeriods(id);
      if (!cycle) { set.status = 404; return { error: "Cycle not found" }; }
      return validateResponse(CycleSchema, cycle);
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
            VALUES (${id}, (SELECT id FROM type_periode WHERE name = ${PERIOD_TYPE_NAMES[p.typePeriode]}), ${p.time}, ${p.index})
          `;
        }
      }
      const result = await getCycleWithPeriods(id);
      if (!result) { set.status = 404; return { error: "Cycle not found" }; }
      return validateResponse(CycleSchema, result);
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

  .get("/api/cycles/:id/periods", async ({ params: { id }, set }) => {
    try {
      const [cycle] = await db`SELECT id FROM cycle WHERE id = ${id}`;
      if (!cycle) { set.status = 404; return { error: "Cycle not found" }; }
      const periods = await db`
        SELECT p.id, p.cycle_id, p.time, p.index, tp.name AS type_name
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

  .post("/api/cycles/:id/periods", async ({ params: { id }, body, set }) => {
    const { id: periodId, typePeriode, time, index } = body as any;
    if (typePeriode === undefined || time === undefined || index === undefined) {
      set.status = 400;
      return { error: "typePeriode, time and index are required" };
    }
    try {
      const [period] = await db`
        INSERT INTO period (id, cycle_id, type_periode_id, time, index)
        VALUES (
          COALESCE(${periodId ?? null}, gen_random_uuid()),
          ${id},
          (SELECT id FROM type_periode WHERE name = ${PERIOD_TYPE_NAMES[typePeriode]}),
          ${time}, ${index}
        )
        RETURNING id
      `;
      set.status = 201;
      return validateResponse(PeriodSchema, await getPeriodById(period.id));
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .get("/api/periods/:id", async ({ params: { id }, set }) => {
    try {
      const period = await getPeriodById(id);
      if (!period) { set.status = 404; return { error: "Period not found" }; }
      return validateResponse(PeriodSchema, period);
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .put("/api/periods/:id", async ({ params: { id }, body, set }) => {
    const { typePeriode, time, index } = body as any;
    const typeName = typeof typePeriode === "number" ? PERIOD_TYPE_NAMES[typePeriode] : undefined;
    try {
      const [updated] = await db`
        UPDATE period
        SET
          type_periode_id = COALESCE((SELECT id FROM type_periode WHERE name = ${typeName ?? null}), type_periode_id),
          time            = COALESCE(${time ?? null}, time),
          index           = COALESCE(${index ?? null}, index)
        WHERE id = ${id}
        RETURNING id
      `;
      if (!updated) { set.status = 404; return { error: "Period not found" }; }
      return validateResponse(PeriodSchema, await getPeriodById(id));
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
