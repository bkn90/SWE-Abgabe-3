# ---- deps ----
FROM node:20-alpine AS deps
WORKDIR /app

# pnpm via corepack
RUN corepack enable

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Optional, aber empfehlenswert (Next standalone):
# -> in next.config.(js|mjs) output: "standalone"
RUN pnpm build

# ---- run ----
FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
RUN corepack enable

# Wenn du NICHT standalone nutzt:
COPY --from=build /app ./

USER nextjs
EXPOSE 3001
CMD ["pnpm", "start", "-p", "3001"]
