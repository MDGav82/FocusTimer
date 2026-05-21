import { serve } from "bun";
import { Elysia } from "elysia";
import index from "./index.html";
import { authRoutes } from "./backend/routes/auth";
import { userRoutes } from "./backend/routes/users";
import { taskRoutes } from "./backend/routes/tasks";
import { cycleRoutes } from "./backend/routes/cycles";
import { historyRoutes } from "./backend/routes/history";
import { referenceRoutes } from "./backend/routes/references";
import { swaggerRoutes } from "./backend/swagger";

// All API routes handled by Elysia
const api = new Elysia()
  .use(authRoutes)
  .use(userRoutes)
  .use(taskRoutes)
  .use(cycleRoutes)
  .use(historyRoutes)
  .use(referenceRoutes)
  .use(swaggerRoutes);

// Bun serves the React frontend with HMR, and delegates /api/* to Elysia
const server = serve({
  routes: {
    "/api/*": (req: Request) => api.handle(req),
    "/api-docs*": (req: Request) => api.handle(req),
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
