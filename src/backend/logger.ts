// 12-factor XI: treat logs as event streams. Emit one structured JSON line per
// event, unbuffered, to stdout (info) / stderr (error). The execution
// environment (Docker, etc.) handles routing and archival — the app never opens
// log files or manages rotation itself.
type Fields = Record<string, unknown>;

function emit(stream: NodeJS.WriteStream, level: string, fields: Fields) {
  stream.write(JSON.stringify({ level, time: new Date().toISOString(), ...fields }) + "\n");
}

export const log = {
  info: (fields: Fields) => emit(process.stdout, "info", fields),
  error: (message: string, err?: unknown, fields: Fields = {}) =>
    emit(process.stderr, "error", {
      message,
      error: err instanceof Error ? err.message : err != null ? String(err) : undefined,
      stack: err instanceof Error ? err.stack : undefined,
      ...fields,
    }),
};