import { SQL } from "bun";

const url =
  process.env.DATABASE_URL ??
  `postgres://${process.env.POSTGRES_USER ?? "postgres"}:${process.env.POSTGRES_PASSWORD ?? "postgres"}@${process.env.DB_HOST ?? "localhost"}:${process.env.DB_PORT ?? "5432"}/${process.env.POSTGRES_DB ?? "focustimer"}`;

export const db = new SQL(url);