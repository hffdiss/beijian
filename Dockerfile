FROM node:22-slim AS builder

# Install build tools for better-sqlite3 native compilation
RUN apt-get update && apt-get install -y python3 make g++ --no-install-recommends && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files + prisma schema first (postinstall runs prisma generate)
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma/schema.prisma prisma/

# Install all deps (postinstall's prisma generate needs schema)
RUN npm ci

# Copy source and build
COPY . .
# Ensure optional import file exists for the runner stage
RUN touch beijian.xlsx
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Production stage ──
FROM node:22-slim AS runner

RUN apt-get update && apt-get install -y python3 make g++ --no-install-recommends && rm -rf /var/lib/apt/lists/* && \
    npm install -g tsx

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy standalone output
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Prisma schema + config + generated client (needed for db push + seed)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/src/generated ./src/generated

# Copy full node_modules (preserves natively compiled binaries)
COPY --from=builder /app/node_modules ./node_modules
RUN npm prune --omit=dev 2>/dev/null || true

# Entrypoint for db init
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Optional: import file
COPY --from=builder /app/beijian.xlsx ./beijian.xlsx

RUN mkdir -p prisma backups

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["/entrypoint.sh"]
CMD []
