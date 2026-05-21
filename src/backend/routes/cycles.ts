import { db } from "../db";

type PeriodInput = {
  type_periode_id: number;
  time: number;
  index: number;
};

async function getCycleWithPeriods(cycleId: number | string) {
  const [cycle] = await db`
    SELECT id, user_id, name FROM cycle WHERE id = ${cycleId}
  `;

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

export const cycleRoutes = {
  "/api/users/:userId/cycles": {
    async GET(req: Request & { params: { userId: string } }) {
      try {
        const { userId } = req.params;

        const cycles = await db`
          SELECT id, name FROM cycle WHERE user_id = ${userId} ORDER BY id ASC
        `;

        const results = await Promise.all(
          cycles.map((c: { id: number }) => getCycleWithPeriods(c.id))
        );

        return Response.json(results);
      } catch {
        return Response.json({ error: "Internal server error" }, { status: 500 });
      }
    },

    async POST(req: Request & { params: { userId: string } }) {
      try {
        const { userId } = req.params;
        const { name, periods } = await req.json();

        if (!name) {
          return Response.json({ error: "Name is required" }, { status: 400 });
        }

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

        const result = await getCycleWithPeriods(cycle.id);
        return Response.json(result, { status: 201 });
      } catch {
        return Response.json({ error: "Internal server error" }, { status: 500 });
      }
    },
  },

  "/api/cycles/:id": {
    async GET(req: Request & { params: { id: string } }) {
      try {
        const { id } = req.params;
        const cycle = await getCycleWithPeriods(id);

        if (!cycle) {
          return Response.json({ error: "Cycle not found" }, { status: 404 });
        }

        return Response.json(cycle);
      } catch {
        return Response.json({ error: "Internal server error" }, { status: 500 });
      }
    },

    async PUT(req: Request & { params: { id: string } }) {
      try {
        const { id } = req.params;
        const { name, periods } = await req.json();

        if (name !== undefined) {
          const [updated] = await db`
            UPDATE cycle SET name = ${name} WHERE id = ${id} RETURNING id
          `;
          if (!updated) {
            return Response.json({ error: "Cycle not found" }, { status: 404 });
          }
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
        if (!result) {
          return Response.json({ error: "Cycle not found" }, { status: 404 });
        }

        return Response.json(result);
      } catch {
        return Response.json({ error: "Internal server error" }, { status: 500 });
      }
    },

    async DELETE(req: Request & { params: { id: string } }) {
      try {
        const { id } = req.params;

        const [deleted] = await db`
          DELETE FROM cycle WHERE id = ${id} RETURNING id
        `;

        if (!deleted) {
          return Response.json({ error: "Cycle not found" }, { status: 404 });
        }

        return new Response(null, { status: 204 });
      } catch {
        return Response.json({ error: "Internal server error" }, { status: 500 });
      }
    },
  },

  "/api/cycles/:cycleId/periods": {
    async GET(req: Request & { params: { cycleId: string } }) {
      try {
        const { cycleId } = req.params;

        const [cycle] = await db`SELECT id FROM cycle WHERE id = ${cycleId}`;
        if (!cycle) {
          return Response.json({ error: "Cycle not found" }, { status: 404 });
        }

        const periods = await db`
          SELECT p.id, p.time, p.index, p.type_periode_id, tp.name AS type_name
          FROM period p
          JOIN type_periode tp ON tp.id = p.type_periode_id
          WHERE p.cycle_id = ${cycleId}
          ORDER BY p.index ASC
        `;

        return Response.json(periods);
      } catch {
        return Response.json({ error: "Internal server error" }, { status: 500 });
      }
    },

    async POST(req: Request & { params: { cycleId: string } }) {
      try {
        const { cycleId } = req.params;
        const { type_periode_id, time, index } = await req.json();

        if (type_periode_id === undefined || time === undefined || index === undefined) {
          return Response.json(
            { error: "type_periode_id, time and index are required" },
            { status: 400 }
          );
        }

        const [period] = await db`
          INSERT INTO period (cycle_id, type_periode_id, time, index)
          VALUES (${cycleId}, ${type_periode_id}, ${time}, ${index})
          RETURNING *
        `;

        return Response.json(period, { status: 201 });
      } catch {
        return Response.json({ error: "Internal server error" }, { status: 500 });
      }
    },
  },

  "/api/periods/:id": {
    async GET(req: Request & { params: { id: string } }) {
      try {
        const { id } = req.params;

        const [period] = await db`
          SELECT p.id, p.cycle_id, p.time, p.index, p.type_periode_id, tp.name AS type_name
          FROM period p
          JOIN type_periode tp ON tp.id = p.type_periode_id
          WHERE p.id = ${id}
        `;

        if (!period) {
          return Response.json({ error: "Period not found" }, { status: 404 });
        }

        return Response.json(period);
      } catch {
        return Response.json({ error: "Internal server error" }, { status: 500 });
      }
    },

    async PUT(req: Request & { params: { id: string } }) {
      try {
        const { id } = req.params;
        const body = await req.json();

        const typePeriodeId = body.type_periode_id ?? null;
        const time = body.time ?? null;
        const index = body.index ?? null;

        const [period] = await db`
          UPDATE period
          SET
            type_periode_id = COALESCE(${typePeriodeId}, type_periode_id),
            time            = COALESCE(${time}, time),
            index           = COALESCE(${index}, index)
          WHERE id = ${id}
          RETURNING *
        `;

        if (!period) {
          return Response.json({ error: "Period not found" }, { status: 404 });
        }

        return Response.json(period);
      } catch {
        return Response.json({ error: "Internal server error" }, { status: 500 });
      }
    },

    async DELETE(req: Request & { params: { id: string } }) {
      try {
        const { id } = req.params;

        const [deleted] = await db`
          DELETE FROM period WHERE id = ${id} RETURNING id
        `;

        if (!deleted) {
          return Response.json({ error: "Period not found" }, { status: 404 });
        }

        return new Response(null, { status: 204 });
      } catch {
        return Response.json({ error: "Internal server error" }, { status: 500 });
      }
    },
  },
};