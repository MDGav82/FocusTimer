import { z } from "zod";

/** Fetches `url` and rejects if the response status is not ok, instead of silently treating an error body as valid data. */
export async function apiFetch(url: string, init?: RequestInit): Promise<unknown> {
    // JSON par défaut ; un Content-Type explicite (placé après) garde la priorité.
    const res = await fetch(url, {
        ...init,
        headers: { "Content-Type": "application/json", ...init?.headers },
    });
    if (!res.ok) {
        throw new Error(`API request to ${url} failed with status ${res.status}`);
    }
    return res.json();
}

/**
 * Validates `data` against `schema`, and checks its `id` matches `expectedId` when one is given.
 * Guards against the backend silently returning malformed or mismatched data
 * (e.g. a 200 response with an empty body or a different row).
 */
export function parseEntity<T extends { id: string }>(schema: z.ZodType<T>, data: unknown, expectedId?: string): T {
    const parsed = schema.parse(data);
    if (expectedId !== undefined && parsed.id !== expectedId) {
        throw new Error(`API returned entity with id "${parsed.id}", expected "${expectedId}"`);
    }
    return parsed;
}

/** Validates an array response, entity by entity, against `schema`. */
export function parseEntityList<T extends { id: string }>(schema: z.ZodType<T>, data: unknown): T[] {
    return z.array(schema).parse(data);
}
