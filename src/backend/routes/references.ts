import { db } from "../db";

export const referenceRoutes = {
  "/api/status": {
    async GET() {
      try {
        const statuses = await db`SELECT id, name FROM status ORDER BY id ASC`;
        return Response.json(statuses);
      } catch {
        return Response.json({ error: "Internal server error" }, { status: 500 });
      }
    },
  },

  "/api/type_periode": {
    async GET() {
      try {
        const types = await db`SELECT id, name FROM type_periode ORDER BY id ASC`;
        return Response.json(types);
      } catch {
        return Response.json({ error: "Internal server error" }, { status: 500 });
      }
    },
  },
};
