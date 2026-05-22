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

const api = new Elysia()
  .use(authRoutes)
  .use(userRoutes)
  .use(taskRoutes)
  .use(cycleRoutes)
  .use(historyRoutes)
  .use(referenceRoutes)
  .use(swaggerRoutes);

const isProd = process.env.NODE_ENV === "production";


const server = serve({
  routes: {
    "/api/*": (req: Request) => api.handle(req),
    "/api-docs": (req: Request) => api.handle(req),
    "/api-docs/*": (req: Request) => api.handle(req),
    "/*": isProd
      ? async (req: Request) => {
          const url = new URL(req.url);
          const filePath = `./dist${url.pathname}`;
          const file = Bun.file(filePath);
          const exists = url.pathname !== "/" && (await file.exists());

          if (exists) {
            return new Response(file, {
              headers: {
                "Cache-Control": "public, max-age=31536000, immutable",
              },
            });
          }

          return new Response(Bun.file("./dist/index.html"), {
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "no-cache, no-store, must-revalidate",
            },
          });
        }
      : index,
  },
  development: !isProd && { hmr: true, console: true },
});

console.log(`🚀 Server running at ${server.url}`);
