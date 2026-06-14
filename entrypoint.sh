#!/bin/sh
set -e

cd /app

# Apply database schema via better-sqlite3 (avoids prisma db push engine URL issue)
echo "→ Applying database schema..."
node -e "
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const url = process.env.DATABASE_URL || 'file:./prisma/dev.db';
const dbPath = url.replace(/^file:/, '');
const db = new Database(dbPath);

// Check if tables already exist
const tables = db.prepare(\"SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%'\").all();
if (tables.length > 0) {
  console.log('✓ Database already initialized (' + tables.length + ' tables found)');
  db.close();
  process.exit(0);
}

const sql = fs.readFileSync(path.join(process.cwd(), 'prisma/schema.sql'), 'utf-8');
db.exec(sql);
db.close();
console.log('✓ Database schema applied');
"
echo "✓ Database schema ready"

# Seed default admin user (idempotent)
echo "→ Running seed..."
npx tsx prisma/seed.ts
echo "✓ Seed complete"

echo "→ Starting server..."
exec node server.js
