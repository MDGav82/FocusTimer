import { Elysia } from "elysia";
import { db } from "../db";

// Public routes — no auth required
export const referenceRoutes = new Elysia()

  .get("/api/status", async ({ set }) => {
    try {
      return await db`SELECT id, name FROM status ORDER BY id ASC`;
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  })

  .get("/api/type_periode", async ({ set }) => {
    try {
      return await db`SELECT id, name FROM type_periode ORDER BY id ASC`;
    } catch {
      set.status = 500;
      return { error: "Internal server error" };
    }
  });
