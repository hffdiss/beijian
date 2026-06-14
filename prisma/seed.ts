import { PrismaClient } from "../src/generated/prisma/client";
import { hash } from "bcryptjs";

async function createClient(): Promise<PrismaClient> {
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  if (url.startsWith("file:")) {
    const { PrismaBetterSqlite3 } = await import("@prisma/adapter-better-sqlite3");
    const adapter = new PrismaBetterSqlite3({ url });
    return new PrismaClient({ adapter });
  }
  return new PrismaClient();
}

async function seed() {
  const prisma = await createClient();

  const passwordHash = await hash("admin123", 12);
  const existing = await prisma.user.findUnique({ where: { username: "admin" } });
  if (existing) {
    await prisma.user.update({
      where: { username: "admin" },
      data: { passwordHash, role: "admin", passwordChanged: false },
    });
    console.log("✓ Admin user reset to default (admin / admin123)");
  } else {
    await prisma.user.create({
      data: {
        username: "admin",
        passwordHash,
        role: "admin",
        passwordChanged: false,
      },
    });
    console.log("✓ Default admin user created (admin / admin123)");
  }
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
