// One-off admin process (12-factor XII): applies pending SQL migrations against
// the database, using the same codebase and configuration as the app.

import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { db } from "./db";

const MIGRATIONS_DIR =
  process.env.MIGRATIONS_DIR ?? join(process.cwd(), "migrations");

async function migrate() {
  await db`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    TEXT PRIMARY KEY,
      applied_at BIGINT NOT NULL
    )
  `;

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log(`No migration files found in ${MIGRATIONS_DIR}`);
    return;
  }

  const appliedRows = await db<{ version: string }[]>`
    SELECT version FROM schema_migrations
  `;
  const applied = new Set(appliedRows.map((r) => r.version));

  let count = 0;
  for (const version of files) {
    if (applied.has(version)) continue;

    const sql = await Bun.file(join(MIGRATIONS_DIR, version)).text();

    // Run the migration and its bookkeeping insert in a single transaction so a
    // failure leaves no partially-applied schema and no recorded version.
    try {
      await db.begin(async (tx) => {
        await tx.unsafe(sql).simple();
        await tx`
          INSERT INTO schema_migrations (version, applied_at)
          VALUES (${version}, ${Date.now()})
        `;
      });
    } catch (err) {
      console.error(`✗ migration failed: ${version}`);
      throw err;
    }

    console.log(`✓ applied ${version}`);
    count++;
  }

  console.log(
    count === 0 ? "Database already up to date." : `Applied ${count} migration(s).`,
  );
}

migrate()
  .then(() => db.close())
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error(err);
    await db.close().catch(() => {});
    process.exit(1);
  });
