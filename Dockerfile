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

# better-sqlite3 needs these at runtime
RUN apk add --no-cache python3 make g++

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy standalone output
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# better-sqlite3 native binary is NOT bundled by Next standalone output.
# We must rebuild it in the runner stage.
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/package.json ./package.json

# Rebuild native addon for current platform
RUN cd node_modules/better-sqlite3 && npm run build-release 2>/dev/null || true

# Reinstall only production deps to ensure native builds
RUN npm install --omit=dev 2>/dev/null || true

# Optional: copy import file and backups directory
COPY --from=builder /app/beijian.xlsx ./beijian.xlsx

RUN mkdir -p prisma backups

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
