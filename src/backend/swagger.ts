import swaggerCss from "swagger-ui-dist/swagger-ui.css" with { type: "text" };
import swaggerBundle from "swagger-ui-dist/swagger-ui-bundle.js" with { type: "text" };

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "FocusTimer API",
    description: "Pomodoro",
    version: "1.0.0",
  },
  servers: [{ url: "http://localhost:3000" }],
  tags: [
    { name: "Auth", description: "Authentication (register, login, logout)" },
    { name: "Users", description: "User management" },
    { name: "Parameters", description: "Per-user timer settings" },
    { name: "Tasks", description: "Task management" },
    { name: "Cycles", description: "Pomodoro cycle definitions" },
    { name: "Periods", description: "Individual periods within a cycle" },
    { name: "History", description: "Work session history" },
    { name: "References", description: "Reference data (statuses, period types)" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "token",
        description: "JWT stored in httpOnly cookie, set automatically on login/register",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: { error: { type: "string" } },
        required: ["error"],
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer" },
          email: { type: "string", format: "email" },
          parameters_id: { type: "integer" },
        },
      },
      UserWithParameters: {
        type: "object",
        properties: {
          id: { type: "integer" },
          email: { type: "string", format: "email" },
          parameters_id: { type: "integer" },
          auto_start_work: { type: "boolean" },
          auto_start_rest: { type: "boolean" },
          auto_restart_cycle: { type: "boolean" },
          notifications_on: { type: "boolean" },
        },
      },
      Parameters: {
        type: "object",
        properties: {
          id: { type: "integer" },
          auto_start_work: { type: "boolean" },
          auto_start_rest: { type: "boolean" },
          auto_restart_cycle: { type: "boolean" },
          notifications_on: { type: "boolean" },
        },
      },
      Task: {
        type: "object",
        properties: {
          id: { type: "integer" },
          user_id: { type: "integer" },
          status_id: { type: "integer" },
          status_name: { type: "string", enum: ["pending", "progress", "finish"] },
          title: { type: "string" },
          description: { type: "string", nullable: true },
          estimated_time: { type: "integer", description: "Estimated time in seconds" },
          progress: { type: "integer" },
          time_spent: { type: "integer", description: "Time spent in seconds" },
          creation_date: { type: "string", format: "date-time" },
          start_date: { type: "string", format: "date-time", nullable: true },
          end_date: { type: "string", format: "date-time", nullable: true },
        },
      },
      Period: {
        type: "object",
        properties: {
          id: { type: "integer" },
          cycle_id: { type: "integer" },
          type_periode_id: { type: "integer" },
          type_name: { type: "string", enum: ["work", "break"] },
          time: { type: "integer", description: "Duration in seconds" },
          index: { type: "integer", description: "Order within the cycle" },
        },
      },
      Cycle: {
        type: "object",
        properties: {
          id: { type: "integer" },
          user_id: { type: "integer" },
          name: { type: "string" },
          periods: { type: "array", items: { $ref: "#/components/schemas/Period" } },
        },
      },
      HistoryEntry: {
        type: "object",
        properties: {
          id: { type: "integer" },
          start_date: { type: "string", format: "date-time" },
          time_spent: { type: "integer", description: "Duration in seconds" },
          type_name: { type: "string", enum: ["work", "break"] },
          task_title: { type: "string", nullable: true },
          cycle_name: { type: "string" },
        },
      },
      Status: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string", enum: ["pending", "progress", "finish"] },
        },
      },
      TypePeriode: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string", enum: ["work", "break"] },
        },
      },
      PeriodInput: {
        type: "object",
        required: ["type_periode_id", "time", "index"],
        properties: {
          type_periode_id: { type: "integer", minimum: 1, description: "1 = work, 2 = break" },
          time: { type: "integer", description: "Duration in seconds" },
          index: { type: "integer", description: "Order within the cycle" },
        },
      },
      HistoryRaw: {
        type: "object",
        properties: {
          id: { type: "integer" },
          user_id: { type: "integer" },
          type_periode_id: { type: "integer" },
          cycle_id: { type: "integer" },
          task_id: { type: "integer", nullable: true },
          time_spent: { type: "integer", description: "Duration in seconds" },
          start_date: { type: "string", format: "date-time" },
        },
      },
    },
  },
  paths: {
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 1 },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "User created, token cookie set", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          "400": { description: "Missing email or password", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "409": { description: "Email already in use", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Login successful, token cookie set", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          "400": { description: "Missing email or password", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "401": { description: "Invalid credentials", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout (clears the token cookie)",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": { description: "Logged out", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" } } } } } },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current authenticated user",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": { description: "Current user", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/users": {
      get: {
        tags: ["Users"],
        summary: "Get all users",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": { description: "List of users", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/User" } } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get a user with their parameters",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "User found", content: { "application/json": { schema: { $ref: "#/components/schemas/UserWithParameters" } } } },
          "404": { description: "User not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      put: {
        tags: ["Users"],
        summary: "Update a user's email and/or password",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 1 },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "User updated", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          "404": { description: "User not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "409": { description: "Email already in use", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      delete: {
        tags: ["Users"],
        summary: "Delete a user",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "204": { description: "User deleted" },
          "404": { description: "User not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/users/{id}/parameters": {
      get: {
        tags: ["Parameters"],
        summary: "Get user parameters",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Parameters found", content: { "application/json": { schema: { $ref: "#/components/schemas/Parameters" } } } },
          "404": { description: "User not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      post: {
        tags: ["Parameters"],
        summary: "Create default parameters for a user (only if none exist)",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "201": { description: "Parameters created", content: { "application/json": { schema: { $ref: "#/components/schemas/Parameters" } } } },
          "404": { description: "User not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "409": { description: "Parameters already exist, use PUT to update", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      put: {
        tags: ["Parameters"],
        summary: "Update user parameters (partial update)",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  auto_start_work: { type: "boolean" },
                  auto_start_rest: { type: "boolean" },
                  auto_restart_cycle: { type: "boolean" },
                  notifications_on: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Parameters updated", content: { "application/json": { schema: { $ref: "#/components/schemas/Parameters" } } } },
          "404": { description: "User not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      delete: {
        tags: ["Parameters"],
        summary: "Reset user parameters to default values",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "204": { description: "Parameters reset to defaults" },
          "404": { description: "User not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/users/{id}/tasks": {
      get: {
        tags: ["Tasks"],
        summary: "Get all tasks for a user",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "List of tasks", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Task" } } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      post: {
        tags: ["Tasks"],
        summary: "Create a new task",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title"],
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  estimated_time: { type: "integer", description: "Estimated time in seconds", default: 0 },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Task created", content: { "application/json": { schema: { $ref: "#/components/schemas/Task" } } } },
          "400": { description: "Title is required", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/tasks/{id}": {
      get: {
        tags: ["Tasks"],
        summary: "Get a task by ID",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Task found", content: { "application/json": { schema: { $ref: "#/components/schemas/Task" } } } },
          "404": { description: "Task not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      put: {
        tags: ["Tasks"],
        summary: "Update a task (partial update)",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  status_id: { type: "integer" },
                  estimated_time: { type: "integer" },
                  progress: { type: "integer" },
                  time_spent: { type: "integer" },
                  start_date: { type: "string", format: "date-time" },
                  end_date: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Task updated", content: { "application/json": { schema: { $ref: "#/components/schemas/Task" } } } },
          "404": { description: "Task not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      delete: {
        tags: ["Tasks"],
        summary: "Delete a task",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "204": { description: "Task deleted" },
          "404": { description: "Task not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/users/{id}/cycles": {
      get: {
        tags: ["Cycles"],
        summary: "Get all cycles with periods for a user",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "List of cycles", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Cycle" } } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      post: {
        tags: ["Cycles"],
        summary: "Create a new cycle",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                  periods: { type: "array", items: { $ref: "#/components/schemas/PeriodInput" } },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Cycle created", content: { "application/json": { schema: { $ref: "#/components/schemas/Cycle" } } } },
          "400": { description: "Name is required", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/cycles/{id}": {
      get: {
        tags: ["Cycles"],
        summary: "Get a cycle with its periods",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Cycle found", content: { "application/json": { schema: { $ref: "#/components/schemas/Cycle" } } } },
          "404": { description: "Cycle not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      put: {
        tags: ["Cycles"],
        summary: "Update a cycle name and/or replace its periods",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  periods: { type: "array", items: { $ref: "#/components/schemas/PeriodInput" }, description: "Replaces all existing periods when provided" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Cycle updated", content: { "application/json": { schema: { $ref: "#/components/schemas/Cycle" } } } },
          "404": { description: "Cycle not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      delete: {
        tags: ["Cycles"],
        summary: "Delete a cycle",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "204": { description: "Cycle deleted" },
          "404": { description: "Cycle not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/cycles/{id}/periods": {
      get: {
        tags: ["Periods"],
        summary: "Get all periods for a cycle",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "List of periods", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Period" } } } } },
          "404": { description: "Cycle not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      post: {
        tags: ["Periods"],
        summary: "Add a period to a cycle",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PeriodInput" },
            },
          },
        },
        responses: {
          "201": { description: "Period created", content: { "application/json": { schema: { $ref: "#/components/schemas/Period" } } } },
          "400": { description: "Missing required fields", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/periods/{id}": {
      get: {
        tags: ["Periods"],
        summary: "Get a period by ID",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Period found", content: { "application/json": { schema: { $ref: "#/components/schemas/Period" } } } },
          "404": { description: "Period not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      put: {
        tags: ["Periods"],
        summary: "Update a period (partial update)",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  type_periode_id: { type: "integer" },
                  time: { type: "integer" },
                  index: { type: "integer" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Period updated", content: { "application/json": { schema: { $ref: "#/components/schemas/Period" } } } },
          "404": { description: "Period not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      delete: {
        tags: ["Periods"],
        summary: "Delete a period",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "204": { description: "Period deleted" },
          "404": { description: "Period not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/users/{id}/history": {
      get: {
        tags: ["History"],
        summary: "Get work session history for a user",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "History entries", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/HistoryEntry" } } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      post: {
        tags: ["History"],
        summary: "Record a work session",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["type_periode_id", "cycle_id"],
                properties: {
                  type_periode_id: { type: "integer", description: "1 = work, 2 = break" },
                  cycle_id: { type: "integer" },
                  task_id: { type: "integer", nullable: true },
                  time_spent: { type: "integer", description: "Duration in seconds", default: 0 },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "History entry created", content: { "application/json": { schema: { $ref: "#/components/schemas/HistoryEntry" } } } },
          "400": { description: "Missing required fields", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/history/{id}": {
      get: {
        tags: ["History"],
        summary: "Get a history entry by ID",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "History entry found", content: { "application/json": { schema: { $ref: "#/components/schemas/HistoryEntry" } } } },
          "404": { description: "History entry not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      put: {
        tags: ["History"],
        summary: "Update a history entry (partial update)",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  type_periode_id: { type: "integer", description: "1 = work, 2 = break" },
                  cycle_id: { type: "integer" },
                  task_id: { type: "integer", nullable: true },
                  time_spent: { type: "integer", description: "Duration in seconds" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "History entry updated", content: { "application/json": { schema: { $ref: "#/components/schemas/HistoryRaw" } } } },
          "404": { description: "History entry not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      delete: {
        tags: ["History"],
        summary: "Delete a history entry",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "204": { description: "History entry deleted" },
          "404": { description: "History entry not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/status": {
      get: {
        tags: ["References"],
        summary: "Get all task statuses",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": { description: "List of statuses", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Status" } } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/type_periode": {
      get: {
        tags: ["References"],
        summary: "Get all period types",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": { description: "List of period types", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/TypePeriode" } } } } },
          "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
  },
};

const swaggerUiHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FocusTimer API Docs</title>
  <link rel="stylesheet" href="/api-docs/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="/api-docs/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: "/api-docs/openapi.json",
      dom_id: "#swagger-ui",
      presets: [SwaggerUIBundle.presets.apis],
      layout: "BaseLayout",
      deepLinking: true,
    });
  </script>
</body>
</html>`;

import { Elysia } from "elysia";

export const swaggerRoutes = new Elysia()
  .get("/api-docs", () => new Response(swaggerUiHtml, { headers: { "Content-Type": "text/html" } }))
  .get("/api-docs/openapi.json", () => openApiSpec)
  .get("/api-docs/swagger-ui.css", () => new Response(swaggerCss, { headers: { "Content-Type": "text/css" } }))
  .get("/api-docs/swagger-ui-bundle.js", () => new Response(swaggerBundle, { headers: { "Content-Type": "application/javascript" } }));
