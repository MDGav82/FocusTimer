import type { z } from "zod";

/**
 * Validates an outgoing response against the same Zod schema the OpenAPI spec is
 * generated from (see ./zodOpenApi.ts), then returns the value **unchanged** so
 * the wire shape is preserved exactly (e.g. a nullable date stays `null` rather
 * than being dropped by the schema's `undefined` transform).
 *
 * The point is the throw: if a route ever returns something that doesn't match
 * the documented contract, `parse` throws and the route's `try/catch` turns it
 * into a 500 — surfacing backend/doc drift here, on the server, instead of
 * silently shipping malformed data that only the client would reject.
 */
export function validateResponse<T>(schema: z.ZodType<T>, data: unknown): unknown {
  schema.parse(data);
  return data;
}

/** Array variant of {@link validateResponse}: validates each item, returns the list unchanged. */
export function validateResponseList<T>(schema: z.ZodType<T>, data: unknown[]): unknown[] {
  for (const item of data) schema.parse(item);
  return data;
}
