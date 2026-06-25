//  Logs as event streams. 
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