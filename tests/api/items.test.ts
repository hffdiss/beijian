import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({ url: "file:./test.db" });
const prisma = new PrismaClient({ adapter });

let categoryId: string;

beforeAll(async () => {
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = OFF");
  await prisma.$executeRawUnsafe("DROP TABLE IF EXISTS StockTake");
  await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "Transaction"');
  await prisma.$executeRawUnsafe("DROP TABLE IF EXISTS Item");
  await prisma.$executeRawUnsafe("DROP TABLE IF EXISTS Category");
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON");

  await prisma.$executeRawUnsafe(`
    CREATE TABLE Category (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, parentId TEXT,
      description TEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE Item (
      id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
      description TEXT, sn TEXT, model TEXT, manufacturer TEXT,
      categoryId TEXT NOT NULL, unit TEXT NOT NULL,
      quantity INTEGER DEFAULT 0, safetyStock INTEGER DEFAULT 0,
      position TEXT, supplier TEXT, price REAL,
      warrantyStart DATETIME, warrantyEnd DATETIME,
      nandType TEXT, compatibleProducts TEXT,
      bomCode TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (categoryId) REFERENCES Category(id)
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE "Transaction" (
      id TEXT PRIMARY KEY, type TEXT NOT NULL, itemId TEXT NOT NULL,
      quantity INTEGER NOT NULL, reason TEXT, relatedPerson TEXT,
      note TEXT, batchId TEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (itemId) REFERENCES Item(id)
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE StockTake (
      id TEXT PRIMARY KEY, itemId TEXT NOT NULL,
      expectedQuantity INTEGER NOT NULL, actualQuantity INTEGER NOT NULL,
      difference INTEGER NOT NULL, note TEXT, batchId TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (itemId) REFERENCES Item(id)
    )
  `);

  const cat = await prisma.category.create({ data: { name: "测试分类" } });
  categoryId = cat.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Items API", () => {
  it("creates an item", async () => {
    const item = await prisma.item.create({
      data: {
        code: "CPU-001",
        name: "Intel i9-13900K",
        categoryId,
        unit: "个",
        quantity: 5,
        safetyStock: 2,
      },
    });
    expect(item.code).toBe("CPU-001");
    expect(item.quantity).toBe(5);
  });

  it("enforces unique code", async () => {
    await expect(
      prisma.item.create({
        data: { code: "CPU-001", name: "Dup", categoryId, unit: "个" },
      })
    ).rejects.toThrow();
  });

  it("lists items with search", async () => {
    const items = await prisma.item.findMany({
      where: { name: { contains: "i9" } },
    });
    expect(items.length).toBe(1);
  });

  it("updates item quantity", async () => {
    const item = await prisma.item.findFirst({ where: { code: "CPU-001" } });
    const updated = await prisma.item.update({
      where: { id: item!.id },
      data: { quantity: 10 },
    });
    expect(updated.quantity).toBe(10);
  });

  it("deletes an item", async () => {
    const item = await prisma.item.findFirst({ where: { code: "CPU-001" } });
    await prisma.item.delete({ where: { id: item!.id } });
    const count = await prisma.item.count({ where: { code: "CPU-001" } });
    expect(count).toBe(0);
  });
});
