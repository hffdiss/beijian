FROM node:22-alpine AS builder

# Install build tools for better-sqlite3 native compilation
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install all deps (including devDeps for prisma generate)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

# ── Production stage ──
FROM node:22-alpine AS runner

RUN apk add --no-cache python3 make g++ && \
    npm install -g tsx

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy standalone output
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Prisma schema + generated client (needed for db push + seed)
COPY --from=builder /app/prisma ./prisma
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
