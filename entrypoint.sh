#!/bin/sh
set -e

cd /app

# Create/migrate database tables
echo "→ Running prisma db push..."
npx prisma db push
echo "✓ Database schema ready"

# Seed default admin user (idempotent)
echo "→ Running seed..."
npx tsx prisma/seed.ts
echo "✓ Seed complete"

echo "→ Starting server..."
exec node server.js
