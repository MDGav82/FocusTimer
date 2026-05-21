import { db } from "../db";

export const userRoutes = {
  "/api/users/register": {
    async POST(req: Request) {
      try {
        const { email, password } = await req.json();

        if (!email || !password) {
          return Response.json(
            { error: "Email and password are required" },
            { status: 400 }
          );
        }

        const hashed = await Bun.password.hash(password);

        const [params] = await db`
          INSERT INTO parameters DEFAULT VALUES RETURNING id
        `;

        const [user] = await db`
          INSERT INTO users (email, password, parameters_id)
          VALUES (${email}, ${hashed}, ${params.id})
          RETURNING id, email, parameters_id
        `;

        return Response.json(user, { status: 201 });
      } catch (err: any) {
        if (err.code === "23505") {
          return Response.json({ error: "Email already in use" }, { status: 409 });
        }
        return Response.json({ error: "Internal server error" }, { status: 500 });
      }
    },
  },

  "/api/users/login": {
    async POST(req: Request) {
      try {
        const { email, password } = await req.json();

        if (!email || !password) {
          return Response.json(
            { error: "Email and password are required" },
            { status: 400 }
          );
        }

        const [user] = await db`
          SELECT id, email, password, parameters_id
          FROM users
          WHERE email = ${email}
        `;

        if (!user) {
          return Response.json(
            { error: "Invalid credentials" },
            { status: 401 }
          );
        }

        const valid = await Bun.password.verify(password, user.password);
        if (!valid) {
          return Response.json(
            { error: "Invalid credentials" },
            { status: 401 }
          );
        }

        const { password: _pw, ...safeUser } = user;
        return Response.json(safeUser);
      } catch {
        return Response.json({ error: "Internal server error" }, { status: 500 });
      }
    },
  },

  "/api/users/:id": {
    async GET(req: Request & { params: { id: string } }) {
      try {
        const { id } = req.params;

        const [user] = await db`
          SELECT u.id, u.email, u.parameters_id,
            p.auto_start_work, p.auto_start_rest,
            p.auto_restart_cycle, p.notifications_on
          FROM users u
          JOIN parameters p ON p.id = u.parameters_id
          WHERE u.id = ${id}
        `;

        if (!user) {
          return Response.json(
            { error: "User not found" },
            { status: 404 }
          );
        }

        return Response.json(user);
      } catch {
        return Response.json({ error: "Internal server error" }, { status: 500 });
      }
    },

    async PUT(req: Request & { params: { id: string } }) {
      try {
        const { id } = req.params;
        const body = await req.json();

        const email = body.email ?? null;
        const password = body.password
          ? await Bun.password.hash(body.password)
          : null;

        const [user] = await db`
          UPDATE users
          SET
            email    = COALESCE(${email}, email),
            password = COALESCE(${password}, password)
          WHERE id = ${id}
          RETURNING id, email, parameters_id
        `;

        if (!user) {
          return Response.json({ error: "User not found" }, { status: 404 });
        }

        return Response.json(user);
      } catch (err: any) {
        if (err.code === "23505") {
          return Response.json({ error: "Email already in use" }, { status: 409 });
        }
        return Response.json({ error: "Internal server error" }, { status: 500 });
      }
    },

    async DELETE(req: Request & { params: { id: string } }) {
      try {
        const { id } = req.params;

        const [deleted] = await db`
          DELETE FROM users WHERE id = ${id} RETURNING id
        `;

        if (!deleted) {
          return Response.json({ error: "User not found" }, { status: 404 });
        }

        return new Response(null, { status: 204 });
      } catch {
        return Response.json({ error: "Internal server error" }, { status: 500 });
      }
    },
  },

  "/api/users" : {
    async GET(){
      try{
        const users = await db`
          SELECT id, email, parameters_id FROM users ORDER BY id ASC
        `;
        return Response.json(users);
      } catch {
        return Response.json({ error: "Internal server error" }, { status: 500 });
      }
    },
  },

  "/api/users/:userId/parameters": {
    async GET(req: Request & { params: { userId: string } }) {
      try {
        const { userId } = req.params;

        const [params] = await db`
          SELECT p.*
          FROM parameters p
          JOIN users u ON u.parameters_id = p.id
          WHERE u.id = ${userId}
        `;

        if (!params) {
          return Response.json(
            { error: "User not found" },
            { status: 404 }
          );
        }

        return Response.json(params);
      } catch {
        return Response.json({ error: "Internal server error" }, { status: 500 });
      }
    },
    
    async PUT(req: Request & { params: { userId: string } }) {
      try {
        const { userId } = req.params;
        const body = await req.json();

        const autoStartWork = body.auto_start_work ?? null;
        const autoStartRest = body.auto_start_rest ?? null;
        const autoRestartCycle = body.auto_restart_cycle ?? null;
        const notificationsOn = body.notifications_on ?? null;

        const [updated] = await db`
          UPDATE parameters p
          SET
            auto_start_work    = COALESCE(${autoStartWork}, p.auto_start_work),
            auto_start_rest    = COALESCE(${autoStartRest}, p.auto_start_rest),
            auto_restart_cycle = COALESCE(${autoRestartCycle}, p.auto_restart_cycle),
            notifications_on   = COALESCE(${notificationsOn}, p.notifications_on)
          FROM users u
          WHERE u.parameters_id = p.id AND u.id = ${userId}
          RETURNING p.*
        `;

        if (!updated) {
          return Response.json(
            { error: "User not found" },
            { status: 404 }
          );
        }

        return Response.json(updated);
      } catch {
        return Response.json({ error: "Internal server error" }, { status: 500 });
      }
    },

    async POST(req: Request & { params: { userId: string } }) {
      try {
        const { userId } = req.params;

        const [existing] = await db`
          SELECT parameters_id FROM users WHERE id = ${userId}
        `;

        if (!existing) {
          return Response.json({ error: "User not found" }, { status: 404 });
        }

        if (existing.parameters_id) {
          return Response.json(
            { error: "Parameters already exist, use PUT to update" },
            { status: 409 }
          );
        }

        const [params] = await db`
          INSERT INTO parameters DEFAULT VALUES RETURNING *
        `;

        await db`
          UPDATE users SET parameters_id = ${params.id} WHERE id = ${userId}
        `;

        return Response.json(params, { status: 201 });
      } catch {
        return Response.json({ error: "Internal server error" }, { status: 500 });
      }
    },

    async DELETE(req: Request & { params: { userId: string } }) {
      try {
        const { userId } = req.params;

        const [reset] = await db`
          UPDATE parameters p
          SET
            auto_start_work    = false,
            auto_start_rest    = false,
            auto_restart_cycle = false,
            notifications_on   = true
          FROM users u
          WHERE u.parameters_id = p.id AND u.id = ${userId}
          RETURNING p.*
        `;

        if (!reset) {
          return Response.json({ error: "User not found" }, { status: 404 });
        }

        return new Response(null, { status: 204 });
      } catch {
        return Response.json({ error: "Internal server error" }, { status: 500 });
      }
    },
  },
};