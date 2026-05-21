FROM oven/bun:1.3-alpine AS deps
WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

FROM oven/bun:1.3 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bunfig.toml tsconfig.json bun-env.d.ts ./
COPY src/ ./src/
RUN bun build --compile --minify src/index.ts --outfile=/app/focustimer

FROM debian:bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN groupadd -r appuser && useradd -r -g appuser appuser
COPY --from=builder /app/focustimer ./focustimer
RUN chown appuser:appuser ./focustimer

USER appuser
EXPOSE 3000
CMD ["./focustimer"]
