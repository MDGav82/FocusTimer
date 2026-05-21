import { db } from "../db";

export const historyRoutes = {
  "/api/users/:userId/history": {
    async GET(req: Request & { params: { userId: string } }) {
      try {
        const { userId } = req.params;

        const entries = await db`
          SELECT
            h.id,
            h.start_date,
            h.time_spent,
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

        return Response.json(entries);
      } catch {
        return Response.json({ error: "Internal server error" }, { status: 500 });
      }
    },

    async POST(req: Request & { params: { userId: string } }) {
      try {
        const { userId } = req.params;
        const { type_periode_id, cycle_id, task_id, time_spent } = await req.json();

        if (!type_periode_id || !cycle_id) {
          return Response.json(
            { error: "type_periode_id and cycle_id are required" },
            { status: 400 }
          );
        }

        const [entry] = await db`
          INSERT INTO history (user_id, type_periode_id, cycle_id, task_id, time_spent)
          VALUES (
            ${userId},
            ${type_periode_id},
            ${cycle_id},
            ${task_id ?? null},
            ${time_spent ?? 0}
          )
          RETURNING *
        `;

        return Response.json(entry, { status: 201 });
      } catch {
        return Response.json({ error: "Internal server error" }, { status: 500 });
      }
    },
  },

  "/api/history/:id": {
    async GET(req: Request & { params: { id: string } }) {
      try {
        const { id } = req.params;

        const [entry] = await db`
          SELECT
            h.id,
            h.start_date,
            h.time_spent,
            tp.name AS type_name,
            t.title  AS task_title,
            c.name   AS cycle_name
          FROM history h
          JOIN type_periode tp ON tp.id = h.type_periode_id
          JOIN cycle c         ON c.id  = h.cycle_id
          LEFT JOIN task t     ON t.id  = h.task_id
          WHERE h.id = ${id}
        `;

        if (!entry) {
          return Response.json({ error: "History entry not found" }, { status: 404 });
        }

        return Response.json(entry);
      } catch {
        return Response.json({ error: "Internal server error" }, { status: 500 });
      }
    },

    async PUT(req: Request & { params: { id: string } }) {
      try {
        const { id } = req.params;
        const body = await req.json();

        const typePeriodeId = body.type_periode_id ?? null;
        const cycleId = body.cycle_id ?? null;
        const taskId = body.task_id ?? null;
        const timeSpent = body.time_spent ?? null;

        const [entry] = await db`
          UPDATE history
          SET
            type_periode_id = COALESCE(${typePeriodeId}, type_periode_id),
            cycle_id        = COALESCE(${cycleId}, cycle_id),
            task_id         = COALESCE(${taskId}, task_id),
            time_spent      = COALESCE(${timeSpent}, time_spent)
          WHERE id = ${id}
          RETURNING *
        `;

        if (!entry) {
          return Response.json({ error: "History entry not found" }, { status: 404 });
        }

        return Response.json(entry);
      } catch {
        return Response.json({ error: "Internal server error" }, { status: 500 });
      }
    },

    async DELETE(req: Request & { params: { id: string } }) {
      try {
        const { id } = req.params;

        const [deleted] = await db`
          DELETE FROM history WHERE id = ${id} RETURNING id
        `;

        if (!deleted) {
          return Response.json({ error: "History entry not found" }, { status: 404 });
        }

        return new Response(null, { status: 204 });
      } catch {
        return Response.json({ error: "Internal server error" }, { status: 500 });
      }
    },
  },
};