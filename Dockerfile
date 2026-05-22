FROM oven/bun:1-alpine AS base
WORKDIR /temp/

FROM base AS install
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM base AS builder
COPY --from=install /temp/node_modules node_modules
COPY . .

ENV NODE_ENV=production
RUN bun run build

FROM nginx:alpine
COPY --from=builder /temp/dist /usr/share/nginx/html

EXPOSE 80