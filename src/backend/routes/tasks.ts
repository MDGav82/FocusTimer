import { db } from "../db";

export const taskRoutes = {
  "/api/users/:userId/tasks": {
    async GET(req: Request & { params: { userId: string } }) {
      try {
        const { userId } = req.params;

        const tasks = await db`
          SELECT t.*, s.name AS status_name
          FROM task t
          JOIN status s ON s.id = t.status_id
          WHERE t.user_id = ${userId}
          ORDER BY t.creation_date DESC
        `;

        return Response.json(tasks);
      } catch {
        return Response.json({ error: "Internal server error" }, { status: 500 });
      }
    },

    async POST(req: Request & { params: { userId: string } }) {
      try {
        const { userId } = req.params;
        const body = await req.json();
        const { title, description, estimated_time } = body;

        if (!title) {
          return Response.json({ error: "Title is required" }, { status: 400 });
        }

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

        return Response.json(task, { status: 201 });
      } catch {
        return Response.json({ error: "Internal server error" }, { status: 500 });
      }
    },
  },

  "/api/tasks/:id": {
    async GET(req: Request & { params: { id: string } }) {
      try {
        const { id } = req.params;

        const [task] = await db`
          SELECT t.*, s.name AS status_name
          FROM task t
          JOIN status s ON s.id = t.status_id
          WHERE t.id = ${id}
        `;

        if (!task) {
          return Response.json({ error: "Task not found" }, { status: 404 });
        }

        return Response.json(task);
      } catch {
        return Response.json({ error: "Internal server error" }, { status: 500 });
      }
    },

    async PUT(req: Request & { params: { id: string } }) {
      try {
        const { id } = req.params;
        const body = await req.json();

        const title = body.title ?? null;
        const description = body.description ?? null;
        const statusId = body.status_id ?? null;
        const estimatedTime = body.estimated_time ?? null;
        const progress = body.progress ?? null;
        const timeSpent = body.time_spent ?? null;
        const startDate = body.start_date ?? null;
        const endDate = body.end_date ?? null;

        const [task] = await db`
          UPDATE task
          SET
            title          = COALESCE(${title}, title),
            description    = COALESCE(${description}, description),
            status_id      = COALESCE(${statusId}, status_id),
            estimated_time = COALESCE(${estimatedTime}, estimated_time),
            progress       = COALESCE(${progress}, progress),
            time_spent     = COALESCE(${timeSpent}, time_spent),
            start_date     = COALESCE(${startDate}, start_date),
            end_date       = COALESCE(${endDate}, end_date)
          WHERE id = ${id}
          RETURNING *
        `;

        if (!task) {
          return Response.json({ error: "Task not found" }, { status: 404 });
        }

        return Response.json(task);
      } catch {
        return Response.json({ error: "Internal server error" }, { status: 500 });
      }
    },

    async DELETE(req: Request & { params: { id: string } }) {
      try {
        const { id } = req.params;

        const [deleted] = await db`
          DELETE FROM task WHERE id = ${id} RETURNING id
        `;

        if (!deleted) {
          return Response.json({ error: "Task not found" }, { status: 404 });
        }

        return new Response(null, { status: 204 });
      } catch {
        return Response.json({ error: "Internal server error" }, { status: 500 });
      }
    },
  },
};