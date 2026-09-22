# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1: build the Vue 3 SPA
# ---------------------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2: minimal runtime serving the SPA + the files API
# ---------------------------------------------------------------------------
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY server ./server

# The backend writes temp JSON files into server/store; run as the non-root
# "node" user shipped with the base image. Mount a volume at /app/server/store
# to persist (or inspect) the stored data:
#   docker run -p 3000:3000 -v hse-store:/app/server/store <image>
RUN mkdir -p server/store && chown -R node:node /app
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3000/editor/ > /dev/null || exit 1

# Same command as "npm start", but without the extra npm process so that
# SIGTERM reaches the server for clean shutdowns.
CMD ["node_modules/.bin/tsx", "server/index.ts"]
