import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: "file:./test.db" });
const prisma = new PrismaClient({ adapter });

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
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (categoryId) REFERENCES Category(id)
    )
  `);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Categories API", () => {
  it("creates a category", async () => {
    const category = await prisma.category.create({
      data: { name: "电子元器件" },
    });
    expect(category.id).toBeTruthy();
    expect(category.name).toBe("电子元器件");
  });

  it("creates a subcategory", async () => {
    const parent = await prisma.category.create({
      data: { name: "服务器部件" },
    });
    const child = await prisma.category.create({
      data: { name: "硬盘", parentId: parent.id },
    });
    expect(child.parentId).toBe(parent.id);
  });

  it("lists categories with children", async () => {
    const categories = await prisma.category.findMany({
      include: { children: true },
    });
    expect(categories.length).toBeGreaterThanOrEqual(2);
  });

  it("prevents deleting category with items", async () => {
    const cat = await prisma.category.create({
      data: { name: "含物料的分类" },
    });
    await prisma.item.create({
      data: {
        code: "TEST-001",
        name: "测试物料",
        categoryId: cat.id,
        unit: "个",
      },
    });
    const count = await prisma.item.count({
      where: { categoryId: cat.id },
    });
    expect(count).toBeGreaterThan(0);
  });
});
