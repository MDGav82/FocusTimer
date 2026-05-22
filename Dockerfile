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

FROM oven/bun:1.3-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN groupadd -r appuser && useradd -r -g appuser appuser
COPY --from=deps --chown=appuser:appuser /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appuser /app/dist ./dist
COPY --chown=appuser:appuser package.json bunfig.toml ./
COPY --chown=appuser:appuser src/ ./src/
COPY --chown=appuser:appuser lib/ ./lib/

USER appuser
EXPOSE 3000
CMD ["bun", "src/index.ts"]
