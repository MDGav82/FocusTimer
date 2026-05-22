FROM oven/bun:1.3-slim AS deps
WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

FROM oven/bun:1.3-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bunfig.toml tsconfig.json bun-env.d.ts build.ts ./
COPY src/ ./src/
COPY lib/ ./lib/
RUN bun run build.ts
RUN bun build --compile \
      --define 'process.env.NODE_ENV="production"' \
      --outfile server \
      src/index.ts

FROM gcr.io/distroless/cc-debian12:nonroot AS runner
WORKDIR /app
COPY --from=builder --chown=65532:65532 /app/server ./server
COPY --from=builder --chown=65532:65532 /app/dist ./dist
EXPOSE 3000
CMD ["/app/server"]
