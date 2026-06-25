import { SQL } from "bun";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} environment variable is not set`);
  return value;
}

const url =
  process.env.DATABASE_URL ??
  `postgres://${required("POSTGRES_USER")}:${required("POSTGRES_PASSWORD")}@${process.env.DB_HOST ?? "localhost"}:${process.env.DB_PORT ?? "5432"}/${required("POSTGRES_DB")}`;

export const db = new SQL(url);