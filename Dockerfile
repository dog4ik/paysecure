# builder
FROM node:22-slim AS builder

WORKDIR /app

RUN apt-get update -qq && \
  apt-get install -y --no-install-recommends \
  python3 \
  make \
  g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY tsconfig.json ./
COPY drizzle.config.ts ./
COPY drizzle/ ./drizzle/

# Install dependencies
RUN npm ci

COPY src/ ./src/

RUN npm run build

# runtime
FROM node:22-slim

WORKDIR /app

RUN apt-get update -qq && \
  apt-get install -y --no-install-recommends \
  sqlite3 \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./

RUN mkdir -p /app/data

CMD ["node", "dist/src/index.js"]
