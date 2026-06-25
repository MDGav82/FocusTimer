import { mock } from "bun:test";

/**
 * Shared mock for `src/backend/db.ts`'s `db` tagged-template export.
 *
 * Usage in a test file — `mock.module` must run before the route module is
 * loaded, and Bun only honors that ordering via a dynamic import done after
 * the call (a statically-imported setup file runs too late, since static
 * imports resolve before the importing module's own top-level code):
 *
 *   import { mock } from "bun:test";
 *   import { dbMock } from "../../helpers/db.mock";
 *   mock.module("@/backend/db", () => ({ db: dbMock }));
 *   const { someRoutes } = await import("@/backend/routes/some");
 *
 * Queue results with `dbMock.mockResolvedValueOnce(rows)` in the same order
 * the route under test issues its queries, and call `dbMock.mockReset()`
 * between tests.
 */
export const dbMock = mock(async (..._args: unknown[]) => [] as any[]);
