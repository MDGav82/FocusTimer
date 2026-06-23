import { z } from "zod";
import {
  ParametersSchema,
  UserSchema,
  PeriodSchema,
  CycleSchema,
  TaskSchema,
  AuthCredentialsSchema,
  UserUpdateSchema,
  ParametersUpdateSchema,
  TaskCreateSchema,
  TaskUpdateSchema,
  PeriodInputSchema,
  CycleCreateSchema,
  CycleUpdateSchema,
} from "@/model/schemas.ts";

/**
 * Zod is the single source of truth for the shape of the entities the API
 * returns (see `src/storage/schemas.ts`, used by the Api*Repository classes to
 * validate responses). Rather than re-describing those same shapes by hand in
 * the OpenAPI spec — and letting the two silently drift — we derive the
 * component schemas straight from the Zod schemas here.
 *
 * The keys must match the `$ref: "#/components/schemas/<name>"` references used
 * in `swagger.ts`.
 */
// Typed metadata (`{ id }`) so `z.toJSONSchema` resolves to the registry overload.
const registry = z.registry<{ id: string }>();
registry.add(ParametersSchema, { id: "Parameters" });
registry.add(UserSchema, { id: "User" });
registry.add(PeriodSchema, { id: "Period" });
registry.add(CycleSchema, { id: "Cycle" });
registry.add(TaskSchema, { id: "Task" });
// Request body schemas (API inputs)
registry.add(AuthCredentialsSchema, { id: "AuthCredentials" });
registry.add(UserUpdateSchema, { id: "UserUpdate" });
registry.add(ParametersUpdateSchema, { id: "ParametersUpdate" });
registry.add(TaskCreateSchema, { id: "TaskCreate" });
registry.add(TaskUpdateSchema, { id: "TaskUpdate" });
registry.add(PeriodInputSchema, { id: "PeriodInput" });
registry.add(CycleCreateSchema, { id: "CycleCreate" });
registry.add(CycleUpdateSchema, { id: "CycleUpdate" });

const { schemas } = z.toJSONSchema(registry, {
  // OpenAPI 3.0 dialect: emits `nullable: true` instead of `type: [..., "null"]`.
  target: "openapi-3.0",
  // These schemas validate API *responses*, so the wire format is their input
  // side: dates arrive as ISO strings before `z.coerce.date()` turns them into
  // Date objects, so the input side is what the JSON over the wire looks like.
  io: "input",
  // `z.date()` has no JSON Schema representation; we override it below rather
  // than letting the conversion throw.
  unrepresentable: "any",
  uri: (id) => `#/components/schemas/${id}`,
  override(ctx) {
    const def = (ctx.zodSchema as { _zod?: { def?: { type?: string } } })._zod?.def;
    if (def?.type === "date") {
      for (const key of Object.keys(ctx.jsonSchema)) {
        delete (ctx.jsonSchema as Record<string, unknown>)[key];
      }
      ctx.jsonSchema.type = "string";
      ctx.jsonSchema.format = "date-time";
    }
  },
  // Narrow each JSON Schema value to a plain record so we can spread/strip `$id` below.
}) as unknown as { schemas: Record<string, Record<string, unknown>> };

/**
 * The generated component schemas, keyed by name. `$id` is stripped because
 * OpenAPI component schemas are referenced by their position under
 * `components/schemas`, not by an embedded identifier.
 */
export const zodComponentSchemas: Record<string, Record<string, unknown>> =
  Object.fromEntries(
    Object.entries(schemas).map(([name, schema]) => {
      const { $id, ...rest } = schema;
      return [name, rest];
    }),
  );
