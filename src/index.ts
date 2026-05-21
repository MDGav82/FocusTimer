import { serve } from "bun";
import index from "./index.html";
import { userRoutes } from "./backend/routes/users";
import { taskRoutes } from "./backend/routes/tasks";
import { cycleRoutes } from "./backend/routes/cycles";
import { historyRoutes } from "./backend/routes/history";
import { referenceRoutes } from "./backend/routes/references";
import { swaggerRoutes } from "./backend/swagger";

const server = serve({
  routes: {
    ...userRoutes,
    ...taskRoutes,
    ...cycleRoutes,
    ...historyRoutes,
    ...referenceRoutes,
    ...swaggerRoutes,
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
