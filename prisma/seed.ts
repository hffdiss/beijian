import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hash } from "bcryptjs";

async function seed() {
  const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
  const prisma = new PrismaClient({ adapter });

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
