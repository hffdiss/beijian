# 备品备件管理系统 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建个人使用的备品备件管理系统，支持物料管理、出入库、盘点、预警和备份。

**Architecture:** Next.js App Router 全栈一体应用，服务端组件直连 Prisma/SQLite，API 路由处理数据变更，shadcn/ui 组件构建响应式界面。

**Tech Stack:** Next.js 14+ / TypeScript / Prisma / SQLite / shadcn/ui / Tailwind CSS / vitest

---

### Task 1: 项目脚手架与基础设施

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `postcss.config.js`, `components.json`
- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`
- Create: `src/app/globals.css`, `src/app/layout.tsx`
- Create: `.env`, `.gitignore`
- Create: `vitest.config.ts`

- [ ] **Step 1: 使用 create-next-app 初始化项目**

Run:
```bash
cd /Users/felix/code/beijian
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

Expected: 交互式确认后创建 Next.js 项目文件。

- [ ] **Step 2: 安装 Prisma 和 shadcn/ui**

Run:
```bash
npm install prisma @prisma/client
npx prisma init --datasource-provider sqlite
npx shadcn@latest init --defaults
```

- [ ] **Step 3: 安装 shadcn/ui 所需组件**

Run:
```bash
npx shadcn@latest add button input table dialog form select card badge separator sheet dropdown-menu tabs textarea calendar popover command
```

- [ ] **Step 4: 安装测试依赖**

Run:
```bash
npm install -D vitest @vitejs/plugin-react
```

- [ ] **Step 5: 编写 Prisma schema**

Write to `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Category {
  id          String     @id @default(cuid())
  name        String
  parentId    String?
  description String?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  parent      Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryTree")
  items       Item[]
}

model Item {
  id                 String        @id @default(cuid())
  code               String        @unique
  name               String
  description        String?
  sn                 String?
  model              String?
  manufacturer       String?
  categoryId         String
  unit               String
  quantity           Int           @default(0)
  safetyStock        Int           @default(0)
  position           String?
  supplier           String?
  price              Float?
  warrantyStart      DateTime?
  warrantyEnd        DateTime?
  nandType           String?
  compatibleProducts String?
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt
  category           Category      @relation(fields: [categoryId], references: [id])
  transactions       Transaction[]
  stockTakes         StockTake[]
}

model Transaction {
  id            String      @id @default(cuid())
  type          String
  itemId        String
  quantity      Int
  reason        String?
  relatedPerson String?
  note          String?
  batchId       String?
  createdAt     DateTime    @default(now())
  item          Item        @relation(fields: [itemId], references: [id])
}

model StockTake {
  id               String   @id @default(cuid())
  itemId           String
  expectedQuantity Int
  actualQuantity   Int
  difference       Int
  note             String?
  batchId          String
  createdAt        DateTime @default(now())
  item             Item     @relation(fields: [itemId], references: [id])
}
```

- [ ] **Step 6: 编写 .env**

Write to `.env`:
```
DATABASE_URL="file:./dev.db"
```

- [ ] **Step 7: 运行 Prisma 迁移**

Run:
```bash
npx prisma db push
npx prisma generate
```

Expected: `dev.db` 文件创建，Prisma Client 生成。

- [ ] **Step 8: 编写 Prisma 客户端单例**

Write to `src/lib/prisma.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 9: 编写 vitest 配置**

Write to `vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 10: 编写根布局和全局样式**

Write to `src/app/globals.css` (replace default):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }
}
```

Write to `src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "备品备件管理系统",
  description: "个人备品备件管理系统",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-background antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 11: 验证项目可启动**

Run:
```bash
npm run dev
```

Expected: 访问 `http://localhost:3000` 看到 Next.js 默认页面。

- [ ] **Step 12: 提交**

```bash
git add -A
git commit -m "feat: scaffold project with Next.js, Prisma, SQLite, shadcn/ui"
```

---

### Task 2: 分类管理 API

**Files:**
- Create: `src/app/api/categories/route.ts`
- Create: `src/app/api/categories/[id]/route.ts`
- Create: `tests/api/categories.test.ts`

- [ ] **Step 1: 编写分类 API 测试**

Write to `tests/api/categories.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: "file:./test.db" } },
});

beforeAll(async () => {
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = OFF");
  await prisma.$executeRawUnsafe("DROP TABLE IF EXISTS StockTake");
  await prisma.$executeRawUnsafe("DROP TABLE IF EXISTS Transaction");
  await prisma.$executeRawUnsafe("DROP TABLE IF EXISTS Item");
  await prisma.$executeRawUnsafe("DROP TABLE IF EXISTS Category");
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON");

  // Recreate tables
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
```

- [ ] **Step 2: 运行测试（预期失败）**

Run:
```bash
npx vitest run tests/api/categories.test.ts
```

Expected: 测试运行，数据库表创建成功，验证 Prisma 操作正确。

> 注：此处直接测试 Prisma 操作而非 HTTP 请求，验证数据层逻辑。

- [ ] **Step 3: 编写分类 API 路由**

Write to `src/app/api/categories/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { items: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const data = await request.json();
  const category = await prisma.category.create({
    data: { name: data.name, parentId: data.parentId, description: data.description },
  });
  return NextResponse.json(category, { status: 201 });
}
```

Write to `src/app/api/categories/[id]/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const data = await request.json();
  const category = await prisma.category.update({
    where: { id: params.id },
    data: { name: data.name, parentId: data.parentId, description: data.description },
  });
  return NextResponse.json(category);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const itemCount = await prisma.item.count({ where: { categoryId: params.id } });
  if (itemCount > 0) {
    return NextResponse.json(
      { error: "该分类下存在物料，不能删除" },
      { status: 400 }
    );
  }
  await prisma.category.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 4: 运行测试验证**

Run:
```bash
npx vitest run tests/api/categories.test.ts
```

Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: add category management API"
```

---

### Task 3: 分类管理页面

**Files:**
- Create: `src/app/categories/page.tsx`
- Create: `src/components/category-form-dialog.tsx`

- [ ] **Step 1: 编写分类表单对话框组件**

Write to `src/components/category-form-dialog.tsx`:
```tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  description: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  categories: Category[];
  onSaved: () => void;
}

export function CategoryFormDialog({
  open, onOpenChange, category, categories, onSaved,
}: Props) {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setParentId(category.parentId);
      setDescription(category.description ?? "");
    } else {
      setName("");
      setParentId(null);
      setDescription("");
    }
  }, [category, open]);

  const handleSave = async () => {
    setSaving(true);
    const method = category ? "PUT" : "POST";
    const url = category
      ? `/api/categories/${category.id}`
      : "/api/categories";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parentId: parentId || null, description }),
    });
    setSaving(false);
    onOpenChange(false);
    onSaved();
  };

  const rootCategories = categories.filter((c) => !c.parentId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "编辑分类" : "新增分类"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>名称</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>上级分类</Label>
            <Select
              value={parentId ?? "null"}
              onValueChange={(v) => setParentId(v === "null" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="无（顶级分类）" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">无（顶级分类）</SelectItem>
                {rootCategories
                  .filter((c) => c.id !== category?.id)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>描述</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={!name || saving}>
            {saving ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: 编写分类管理页面**

Write to `src/app/categories/page.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { CategoryFormDialog } from "@/components/category-form-dialog";

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  description: string | null;
  _count: { items: number };
  children?: Category[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const load = async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除？")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error);
      return;
    }
    load();
  };

  const topCategories = categories.filter((c) => !c.parentId);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">分类管理</h1>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          新增分类
        </Button>
      </div>

      {topCategories.map((cat) => {
        const children = categories.filter((c) => c.parentId === cat.id);
        return (
          <Card key={cat.id} className="mb-4">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{cat.name}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="secondary">{cat._count.items} 物料</Badge>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => { setEditing(cat); setDialogOpen(true); }}
                  >
                    编辑
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => handleDelete(cat.id)}
                  >
                    删除
                  </Button>
                </div>
              </div>
              {cat.description && (
                <p className="text-sm text-muted-foreground">{cat.description}</p>
              )}
            </CardHeader>
            {children.length > 0 && (
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>名称</TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead>物料数</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {children.map((child) => (
                      <TableRow key={child.id}>
                        <TableCell>{child.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {child.description ?? "-"}
                        </TableCell>
                        <TableCell>{child._count.items}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => { setEditing(child); setDialogOpen(true); }}
                            >
                              编辑
                            </Button>
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => handleDelete(child.id)}
                            >
                              删除
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            )}
          </Card>
        );
      })}

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editing}
        categories={categories}
        onSaved={load}
      />
    </div>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "feat: add category management page"
```

---

### Task 4: 物料管理 API

**Files:**
- Create: `src/app/api/items/route.ts`
- Create: `src/app/api/items/[id]/route.ts`
- Create: `tests/api/items.test.ts`

- [ ] **Step 1: 编写物料 API 测试**

Write to `tests/api/items.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: "file:./test.db" } },
});

let categoryId: string;

beforeAll(async () => {
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = OFF");
  await prisma.$executeRawUnsafe("DROP TABLE IF EXISTS StockTake");
  await prisma.$executeRawUnsafe("DROP TABLE IF EXISTS Transaction");
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
```

- [ ] **Step 2: 运行测试（预期失败 — 验证逻辑后应通过）**

Run:
```bash
npx vitest run tests/api/items.test.ts
```

Expected: PASS（测试直接使用 Prisma，验证数据逻辑）

- [ ] **Step 3: 编写物料 API 路由**

Write to `src/app/api/items/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { code: { contains: q } },
      { model: { contains: q } },
      { sn: { contains: q } },
    ];
  }
  if (categoryId) {
    where.categoryId = categoryId;
  }

  const items = await prisma.item.findMany({
    where,
    include: { category: true },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const data = await request.json();
  const item = await prisma.item.create({
    data: {
      code: data.code,
      name: data.name,
      description: data.description,
      sn: data.sn,
      model: data.model,
      manufacturer: data.manufacturer,
      categoryId: data.categoryId,
      unit: data.unit,
      quantity: data.quantity ?? 0,
      safetyStock: data.safetyStock ?? 0,
      position: data.position,
      supplier: data.supplier,
      price: data.price,
      warrantyStart: data.warrantyStart ? new Date(data.warrantyStart) : null,
      warrantyEnd: data.warrantyEnd ? new Date(data.warrantyEnd) : null,
      nandType: data.nandType,
      compatibleProducts: data.compatibleProducts,
    },
    include: { category: true },
  });
  return NextResponse.json(item, { status: 201 });
}
```

Write to `src/app/api/items/[id]/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const item = await prisma.item.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      transactions: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!item) {
    return NextResponse.json({ error: "物料不存在" }, { status: 404 });
  }
  return NextResponse.json(item);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const data = await request.json();
  const item = await prisma.item.update({
    where: { id: params.id },
    data: {
      code: data.code,
      name: data.name,
      description: data.description,
      sn: data.sn,
      model: data.model,
      manufacturer: data.manufacturer,
      categoryId: data.categoryId,
      unit: data.unit,
      quantity: data.quantity,
      safetyStock: data.safetyStock,
      position: data.position,
      supplier: data.supplier,
      price: data.price,
      warrantyStart: data.warrantyStart ? new Date(data.warrantyStart) : null,
      warrantyEnd: data.warrantyEnd ? new Date(data.warrantyEnd) : null,
      nandType: data.nandType,
      compatibleProducts: data.compatibleProducts,
    },
    include: { category: true },
  });
  return NextResponse.json(item);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const txnCount = await prisma.transaction.count({
    where: { itemId: params.id },
  });
  if (txnCount > 0) {
    return NextResponse.json(
      { error: "该物料存在出入库记录，不能删除" },
      { status: 400 }
    );
  }
  await prisma.item.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 4: 运行测试**

Run:
```bash
npx vitest run tests/api/items.test.ts
```

Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: add item management API"
```

---

### Task 5: 物料管理页面

**Files:**
- Create: `src/app/items/page.tsx`
- Create: `src/components/item-form-dialog.tsx`

- [ ] **Step 1: 编写物料表单对话框组件**

Write to `src/components/item-form-dialog.tsx`:
```tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Item {
  id?: string;
  code: string;
  name: string;
  description?: string;
  sn?: string;
  model?: string;
  manufacturer?: string;
  categoryId: string;
  unit: string;
  quantity?: number;
  safetyStock?: number;
  position?: string;
  supplier?: string;
  price?: number;
  warrantyStart?: string;
  warrantyEnd?: string;
  nandType?: string;
  compatibleProducts?: string;
}

interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Item | null;
  categories: Category[];
  onSaved: () => void;
}

export function ItemFormDialog({
  open, onOpenChange, item, categories, onSaved,
}: Props) {
  const [form, setForm] = useState<Item>({
    code: "", name: "", categoryId: "", unit: "个",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        ...item,
        warrantyStart: item.warrantyStart?.split("T")[0] ?? "",
        warrantyEnd: item.warrantyEnd?.split("T")[0] ?? "",
      });
    } else {
      setForm({ code: "", name: "", categoryId: "", unit: "个" });
    }
  }, [item, open]);

  const update = (key: keyof Item, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const method = item?.id ? "PUT" : "POST";
    const url = item?.id ? `/api/items/${item.id}` : "/api/items";
    const body = {
      ...form,
      warrantyStart: form.warrantyStart || null,
      warrantyEnd: form.warrantyEnd || null,
    };
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    onOpenChange(false);
    onSaved();
  };

  const nandOptions = ["SLC", "MLC", "TLC", "QLC"];
  const unitOptions = ["个", "米", "千克", "卷", "包", "箱", "台", "张", "支", "根"];

  const field = (label: string, key: keyof Item, opts?: { type?: string }) => (
    <div>
      <Label>{label}</Label>
      <Input
        type={opts?.type ?? "text"}
        value={(form[key] as string) ?? ""}
        onChange={(e) => update(key, opts?.type === "number" ? Number(e.target.value) : e.target.value)}
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item?.id ? "编辑物料" : "新增物料"}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="basic">
          <TabsList className="w-full">
            <TabsTrigger value="basic" className="flex-1">基本信息</TabsTrigger>
            <TabsTrigger value="server" className="flex-1">服务器部件</TabsTrigger>
            <TabsTrigger value="other" className="flex-1">其他</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {field("编号", "code")}
              {field("名称", "name")}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>分类</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => update("categoryId", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.parentId ? "  └ " : ""}{c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>单位</Label>
                <Select
                  value={form.unit}
                  onValueChange={(v) => update("unit", v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {unitOptions.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {field("描述", "description")}
            <div className="grid grid-cols-2 gap-3">
              {field("初始库存", "quantity", { type: "number" })}
              {field("安全库存", "safetyStock", { type: "number" })}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {field("存放位置", "position")}
              {field("参考单价", "price", { type: "number" })}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {field("供应商", "supplier")}
              {field("型号", "model")}
            </div>
          </TabsContent>

          <TabsContent value="server" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {field("SN 号", "sn")}
              {field("厂商", "manufacturer")}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>维保起始</Label>
                <Input
                  type="date"
                  value={form.warrantyStart as string ?? ""}
                  onChange={(e) => update("warrantyStart", e.target.value)}
                />
              </div>
              <div>
                <Label>维保截止</Label>
                <Input
                  type="date"
                  value={form.warrantyEnd as string ?? ""}
                  onChange={(e) => update("warrantyEnd", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>SSD 颗粒类型</Label>
              <Select
                value={form.nandType ?? ""}
                onValueChange={(v) => update("nandType", v || "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="不适用" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">不适用</SelectItem>
                  {nandOptions.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {field("适用产品", "compatibleProducts")}
          </TabsContent>

          <TabsContent value="other" className="space-y-3">
            <div>
              <Label>备注</Label>
              <Textarea
                value={form.description ?? ""}
                onChange={(e) => update("description", e.target.value)}
                rows={4}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={!form.code || !form.name || !form.categoryId || saving}
          >
            {saving ? "保存中..." : "保存"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: 编写物料列表页面**

Write to `src/app/items/page.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ItemFormDialog } from "@/components/item-form-dialog";

interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

interface Item {
  id: string;
  code: string;
  name: string;
  model: string | null;
  sn: string | null;
  manufacturer: string | null;
  categoryId: string;
  unit: string;
  quantity: number;
  safetyStock: number;
  position: string | null;
  category: Category;
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);

  const loadItems = async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (categoryId) params.set("categoryId", categoryId);
    const res = await fetch(`/api/items?${params}`);
    setItems(await res.json());
  };

  const loadCategories = async () => {
    const res = await fetch("/api/categories");
    setCategories(await res.json());
  };

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { loadItems(); }, [categoryId]);

  const handleSearch = () => loadItems();

  const categoryName = (cat: Category) =>
    cat.parentId ? `  └ ${cat.name}` : cat.name;

  const categoriesFlat = categories.flatMap((c) => {
    const result = [c];
    const children = categories.filter((x) => x.parentId === c.id);
    result.push(...children);
    return result;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">物料管理</h1>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          新增物料
        </Button>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex gap-3 mb-4">
        <Input
          placeholder="搜索名称/编号/型号/SN..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="max-w-sm"
        />
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="全部分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="null">全部分类</SelectItem>
            {categoriesFlat.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {categoryName(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="secondary" onClick={handleSearch}>搜索</Button>
      </div>

      {/* 桌面端表格 */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>编号</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>型号</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>库存</TableHead>
              <TableHead>位置</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-sm">{item.code}</TableCell>
                <TableCell>
                  <Link href={`/items/${item.id}`} className="hover:underline">
                    {item.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.model ?? "-"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{item.category.name}</Badge>
                </TableCell>
                <TableCell>
                  <span
                    className={
                      item.quantity <= item.safetyStock && item.safetyStock > 0
                        ? "text-red-600 font-semibold"
                        : ""
                    }
                  >
                    {item.quantity} {item.unit}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.position ?? "-"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => { setEditing(item); setDialogOpen(true); }}
                  >
                    编辑
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 手机端卡片 */}
      <div className="md:hidden space-y-3">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <Link href={`/items/${item.id}`} className="font-semibold hover:underline">
                    {item.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">{item.code}</p>
                </div>
                <Badge
                  variant={item.quantity <= item.safetyStock ? "destructive" : "secondary"}
                >
                  {item.quantity} {item.unit}
                </Badge>
              </div>
              <div className="flex gap-2 mt-2 text-sm text-muted-foreground">
                <span>{item.category.name}</span>
                {item.position && <span>| {item.position}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {items.length === 0 && (
        <p className="text-center text-muted-foreground py-12">暂无物料</p>
      )}

      <ItemFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editing}
        categories={categoriesFlat}
        onSaved={loadItems}
      />
    </div>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "feat: add item list page with search and create/edit dialog"
```

---

### Task 6: 物料详情页

**Files:**
- Create: `src/app/items/[id]/page.tsx`

- [ ] **Step 1: 编写物料详情页**

Write to `src/app/items/[id]/page.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface Transaction {
  id: string;
  type: string;
  quantity: number;
  reason: string | null;
  relatedPerson: string | null;
  note: string | null;
  createdAt: string;
}

interface Item {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sn: string | null;
  model: string | null;
  manufacturer: string | null;
  unit: string;
  quantity: number;
  safetyStock: number;
  position: string | null;
  supplier: string | null;
  price: number | null;
  warrantyStart: string | null;
  warrantyEnd: string | null;
  nandType: string | null;
  compatibleProducts: string | null;
  category: { id: string; name: string };
  transactions: Transaction[];
  createdAt: string;
  updatedAt: string;
}

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);

  useEffect(() => {
    fetch(`/api/items/${id}`).then((r) => r.json()).then(setItem);
  }, [id]);

  if (!item) return <div className="p-6">加载中...</div>;

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("zh-CN") : "-";

  const warrantyStatus = () => {
    if (!item.warrantyEnd) return null;
    const end = new Date(item.warrantyEnd);
    const now = new Date();
    const days = Math.ceil((end.getTime() - now.getTime()) / 86400000);
    if (days < 0) return <Badge variant="destructive">维保已过期</Badge>;
    if (days < 30) return <Badge variant="outline" className="border-yellow-500 text-yellow-600">维保即将到期 ({days}天)</Badge>;
    return <Badge variant="secondary">维保中</Badge>;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/items">
          <Button variant="ghost" size="sm">&larr; 返回</Button>
        </Link>
        <h1 className="text-2xl font-bold">{item.name}</h1>
        {warrantyStatus()}
        {item.quantity <= item.safetyStock && item.safetyStock > 0 && (
          <Badge variant="destructive">库存不足</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">当前库存</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {item.quantity}
              <span className="text-base font-normal text-muted-foreground ml-1">{item.unit}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              安全库存: {item.safetyStock} {item.unit}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">参考单价</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {item.price ? `¥${item.price}` : "-"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">库存总值</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {item.price ? `¥${(item.price * item.quantity).toFixed(2)}` : "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 基本信息 */}
      <Card className="mb-6">
        <CardHeader><CardTitle>基本信息</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-muted-foreground">编号:</span> {item.code}</div>
            <div><span className="text-muted-foreground">分类:</span> {item.category.name}</div>
            <div><span className="text-muted-foreground">型号:</span> {item.model ?? "-"}</div>
            <div><span className="text-muted-foreground">SN:</span> {item.sn ?? "-"}</div>
            <div><span className="text-muted-foreground">厂商:</span> {item.manufacturer ?? "-"}</div>
            <div><span className="text-muted-foreground">供应商:</span> {item.supplier ?? "-"}</div>
            <div><span className="text-muted-foreground">位置:</span> {item.position ?? "-"}</div>
            <div><span className="text-muted-foreground">SSD 颗粒:</span> {item.nandType ?? "-"}</div>
            <div><span className="text-muted-foreground">维保起始:</span> {formatDate(item.warrantyStart)}</div>
            <div><span className="text-muted-foreground">维保截止:</span> {formatDate(item.warrantyEnd)}</div>
            <div className="col-span-2">
              <span className="text-muted-foreground">适用产品:</span> {item.compatibleProducts ?? "-"}
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">描述:</span> {item.description ?? "-"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 出入库记录 */}
      <Card>
        <CardHeader><CardTitle>最近出入库记录</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>时间</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>数量</TableHead>
                <TableHead>领用人</TableHead>
                <TableHead>用途</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {item.transactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell>{formatDate(txn.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant={txn.type === "IN" ? "default" : "secondary"}>
                      {txn.type === "IN" ? "入库" : "出库"}
                    </Badge>
                  </TableCell>
                  <TableCell>{txn.quantity}</TableCell>
                  <TableCell>{txn.relatedPerson ?? "-"}</TableCell>
                  <TableCell>{txn.reason ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {item.transactions.length === 0 && (
            <p className="text-center text-muted-foreground py-4">暂无记录</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "feat: add item detail page with transaction history"
```

---

### Task 7: 共享物料选择器组件

**Files:**
- Create: `src/components/item-selector.tsx`

- [ ] **Step 1: 编写物料选择器**

Write to `src/components/item-selector.tsx`:
```tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command, CommandEmpty, CommandGroup, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { ItemFormDialog } from "./item-form-dialog";

interface ItemOption {
  id: string;
  code: string;
  name: string;
  unit: string;
  quantity: number;
  categoryId?: string;
}

interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

interface Props {
  value: string;
  onChange: (item: ItemOption) => void;
  placeholder?: string;
}

export function ItemSelector({ value, onChange, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ItemOption[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [selectedName, setSelectedName] = useState("");

  const loadItems = async (q: string) => {
    const res = await fetch(`/api/items?q=${encodeURIComponent(q)}&limit=20`);
    setItems(await res.json());
  };

  useEffect(() => { loadItems(search); }, [search]);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, []);

  const handleSelect = (item: ItemOption) => {
    onChange(item);
    setSelectedName(item.name);
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start">
            {selectedName || placeholder || "搜索物料..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <div className="p-2">
              <Input
                placeholder="输入名称/编号搜索..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <CommandList>
              <CommandEmpty>
                <div className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">未找到物料</p>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => { setQuickCreateOpen(true); setOpen(false); }}
                  >
                    快速新建物料
                  </Button>
                </div>
              </CommandEmpty>
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    onSelect={() => handleSelect(item)}
                    className="flex justify-between"
                  >
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground ml-2 text-sm">
                        {item.code}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {item.quantity} {item.unit}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <ItemFormDialog
        open={quickCreateOpen}
        onOpenChange={setQuickCreateOpen}
        item={{ code: "", name: search, categoryId: "", unit: "个" } as any}
        categories={categories}
        onSaved={() => {
          loadItems(search);
          setQuickCreateOpen(false);
        }}
      />
    </>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "feat: add shared item selector component with quick-create"
```

---

### Task 8: 出入库 API

**Files:**
- Create: `src/app/api/transactions/route.ts`
- Create: `src/app/api/transactions/[id]/route.ts`

- [ ] **Step 1: 编写出入库 API 路由**

Write to `src/app/api/transactions/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "";
  const itemId = searchParams.get("itemId") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (itemId) where.itemId = itemId;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { item: { select: { id: true, code: true, name: true, unit: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json({ transactions, total, page, limit });
}

export async function POST(request: Request) {
  const data = await request.json();
  // data: { items: Array<{ itemId: string, quantity: number, reason?: string, relatedPerson?: string, note?: string }>, type: "IN" | "OUT" }
  const batchId = Date.now().toString(36);
  const type = data.type;

  const transactions = [];
  for (const row of data.items) {
    const item = await prisma.item.findUnique({ where: { id: row.itemId } });
    if (!item) {
      return NextResponse.json(
        { error: `物料 ${row.itemId} 不存在` }, { status: 400 }
      );
    }

    const qtyChange = type === "IN" ? row.quantity : -row.quantity;
    const newQuantity = item.quantity + qtyChange;

    // 出库时检查库存是否足够
    if (type === "OUT" && newQuantity < 0) {
      return NextResponse.json(
        { error: `物料 ${item.name} 库存不足 (当前: ${item.quantity} ${item.unit})` },
        { status: 400 }
      );
    }

    // 创建记录 + 更新库存
    const [txn] = await Promise.all([
      prisma.transaction.create({
        data: {
          type,
          itemId: row.itemId,
          quantity: row.quantity,
          reason: row.reason,
          relatedPerson: row.relatedPerson,
          note: row.note,
          batchId,
        },
      }),
      prisma.item.update({
        where: { id: row.itemId },
        data: { quantity: newQuantity },
      }),
    ]);
    transactions.push(txn);
  }

  return NextResponse.json({ batchId, transactions }, { status: 201 });
}
```

Write to `src/app/api/transactions/[id]/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE 撤销单条记录
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const txn = await prisma.transaction.findUnique({ where: { id: params.id } });
  if (!txn) {
    return NextResponse.json({ error: "记录不存在" }, { status: 404 });
  }

  // 反向操作恢复库存
  const qtyChange = txn.type === "IN" ? -txn.quantity : txn.quantity;

  await Promise.all([
    prisma.item.update({
      where: { id: txn.itemId },
      data: { quantity: { increment: qtyChange } },
    }),
    prisma.transaction.delete({ where: { id: params.id } }),
  ]);

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "feat: add transaction API with batch create and undo"
```

---

### Task 9: 入库/出库页面

**Files:**
- Create: `src/app/transactions/in/page.tsx`
- Create: `src/app/transactions/out/page.tsx`
- Create: `src/components/transaction-form.tsx`

- [ ] **Step 1: 编写出入库表单组件**

Write to `src/components/transaction-form.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ItemSelector } from "./item-selector";

interface Row {
  itemId: string;
  itemName: string;
  unit: string;
  quantity: number;
  reason: string;
  relatedPerson: string;
  note: string;
}

interface Props {
  type: "IN" | "OUT";
}

export function TransactionForm({ type }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([
    { itemId: "", itemName: "", unit: "", quantity: 1, reason: "", relatedPerson: "", note: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const title = type === "IN" ? "入库" : "出库";

  const addRow = () => {
    setRows([
      ...rows,
      { itemId: "", itemName: "", unit: "", quantity: 1, reason: "", relatedPerson: "", note: "" },
    ]);
  };

  const removeRow = (i: number) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, idx) => idx !== i));
  };

  const updateRow = (i: number, field: keyof Row, value: string | number) => {
    const next = [...rows];
    (next[i] as any)[field] = value;
    setRows(next);
  };

  const handleSubmit = async () => {
    const valid = rows.filter((r) => r.itemId && r.quantity > 0);
    if (valid.length === 0) return;

    setSubmitting(true);
    const body = {
      type,
      items: valid.map((r) => ({
        itemId: r.itemId,
        quantity: r.quantity,
        reason: r.reason,
        relatedPerson: r.relatedPerson,
        note: r.note,
      })),
    };

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error);
      setSubmitting(false);
      return;
    }

    router.push("/transactions/history");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{title}</h1>

      <Card className="mb-4">
        <CardContent className="p-4">
          {rows.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-3 pb-3 border-b last:border-0"
            >
              <div className="md:col-span-3">
                <Label className="text-xs">物料</Label>
                <ItemSelector
                  value={row.itemId}
                  onChange={(item) => {
                    updateRow(i, "itemId", item.id);
                    updateRow(i, "itemName", item.name);
                    updateRow(i, "unit", item.unit);
                  }}
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">数量</Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={1}
                    value={row.quantity}
                    onChange={(e) => updateRow(i, "quantity", parseInt(e.target.value) || 0)}
                  />
                  <span className="text-sm text-muted-foreground shrink-0">{row.unit}</span>
                </div>
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">领用人</Label>
                <Input
                  value={row.relatedPerson}
                  onChange={(e) => updateRow(i, "relatedPerson", e.target.value)}
                  placeholder="可选"
                />
              </div>
              <div className="md:col-span-3">
                <Label className="text-xs">用途</Label>
                <Input
                  value={row.reason}
                  onChange={(e) => updateRow(i, "reason", e.target.value)}
                  placeholder="可选"
                />
              </div>
              <div className="md:col-span-1">
                <Label className="text-xs">备注</Label>
                <Input
                  value={row.note}
                  onChange={(e) => updateRow(i, "note", e.target.value)}
                  placeholder="可选"
                />
              </div>
              <div className="md:col-span-1 flex items-end">
                <Button
                  variant="ghost" size="sm"
                  onClick={() => removeRow(i)}
                  disabled={rows.length === 1}
                >
                  删除
                </Button>
              </div>
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={addRow} className="mt-2">
            + 添加物料
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()}>取消</Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || rows.every((r) => !r.itemId)}
        >
          {submitting ? "提交中..." : `确认${title}`}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 编写入库页面**

Write to `src/app/transactions/in/page.tsx`:
```tsx
import { TransactionForm } from "@/components/transaction-form";

export default function StockInPage() {
  return <TransactionForm type="IN" />;
}
```

- [ ] **Step 3: 编写出库页面**

Write to `src/app/transactions/out/page.tsx`:
```tsx
import { TransactionForm } from "@/components/transaction-form";

export default function StockOutPage() {
  return <TransactionForm type="OUT" />;
}
```

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "feat: add stock in/out pages with multi-item transaction form"
```

---

### Task 10: 出入库记录页

**Files:**
- Create: `src/app/transactions/history/page.tsx`

- [ ] **Step 1: 编写出入库记录页**

Write to `src/app/transactions/history/page.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Transaction {
  id: string;
  type: string;
  quantity: number;
  reason: string | null;
  relatedPerson: string | null;
  note: string | null;
  batchId: string | null;
  createdAt: string;
  item: { id: string; code: string; name: string; unit: string };
}

export default function TransactionHistoryPage() {
  const [data, setData] = useState<{ transactions: Transaction[]; total: number }>({
    transactions: [], total: 0,
  });
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);

  const load = async () => {
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (type) params.set("type", type);
    const res = await fetch(`/api/transactions?${params}`);
    setData(await res.json());
  };

  useEffect(() => { load(); }, [type, page]);

  const handleUndo = async (id: string) => {
    if (!confirm("确定撤销该记录？库存将自动恢复。")) return;
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    load();
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString("zh-CN");

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">出入库记录</h1>
        <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="全部类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="null">全部类型</SelectItem>
            <SelectItem value="IN">入库</SelectItem>
            <SelectItem value="OUT">出库</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>时间</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>物料</TableHead>
            <TableHead>数量</TableHead>
            <TableHead>领用人</TableHead>
            <TableHead>用途</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.transactions.map((txn) => (
            <TableRow key={txn.id}>
              <TableCell className="text-sm">{formatDate(txn.createdAt)}</TableCell>
              <TableCell>
                <Badge variant={txn.type === "IN" ? "default" : "secondary"}>
                  {txn.type === "IN" ? "入库" : "出库"}
                </Badge>
              </TableCell>
              <TableCell>{txn.item.name} <span className="text-muted-foreground text-sm">({txn.item.code})</span></TableCell>
              <TableCell>{txn.quantity} {txn.item.unit}</TableCell>
              <TableCell>{txn.relatedPerson ?? "-"}</TableCell>
              <TableCell className="max-w-[200px] truncate">{txn.reason ?? "-"}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" onClick={() => handleUndo(txn.id)}>
                  撤销
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {data.transactions.length === 0 && (
        <p className="text-center text-muted-foreground py-12">暂无记录</p>
      )}

      {data.total > 50 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline" size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            上一页
          </Button>
          <span className="text-sm text-muted-foreground self-center">
            {page} / {Math.ceil(data.total / 50)}
          </span>
          <Button
            variant="outline" size="sm"
            disabled={page * 50 >= data.total}
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "feat: add transaction history page with filter and undo"
```

---

### Task 11: 盘点功能

**Files:**
- Create: `src/app/api/stocktake/route.ts`
- Create: `src/app/api/stocktake/[id]/route.ts`
- Create: `src/app/stocktake/page.tsx`

- [ ] **Step 1: 编写盘点 API**

Write to `src/app/api/stocktake/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET 盘点批次列表
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get("batchId") ?? "";

  if (batchId) {
    const items = await prisma.stockTake.findMany({
      where: { batchId },
      include: { item: { select: { id: true, code: true, name: true, unit: true, position: true } } },
    });
    return NextResponse.json(items);
  }

  // 获取所有批次（去重）
  const batches = await prisma.stockTake.groupBy({
    by: ["batchId"],
    _count: { id: true },
    _min: { createdAt: true },
    orderBy: { _min: { createdAt: "desc" } },
  });
  return NextResponse.json(batches);
}

// POST 开始新盘点
export async function POST(request: Request) {
  const data = await request.json();
  const batchId = Date.now().toString(36);
  const categoryId = data.categoryId;

  const where = categoryId ? { categoryId } : {};
  const items = await prisma.item.findMany({ where });

  const records = await Promise.all(
    items.map((item) =>
      prisma.stockTake.create({
        data: {
          itemId: item.id,
          expectedQuantity: item.quantity,
          actualQuantity: item.quantity, // 默认等于账面
          difference: 0,
          batchId,
          note: "",
        },
      })
    )
  );

  return NextResponse.json({ batchId, count: records.length }, { status: 201 });
}
```

Write to `src/app/api/stocktake/[id]/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT 更新单条盘点记录
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const data = await request.json();
  const record = await prisma.stockTake.findUnique({ where: { id: params.id } });
  if (!record) return NextResponse.json({ error: "记录不存在" }, { status: 404 });

  const actualQuantity = data.actualQuantity;
  const difference = actualQuantity - record.expectedQuantity;

  const updated = await prisma.stockTake.update({
    where: { id: params.id },
    data: { actualQuantity, difference, note: data.note },
  });
  return NextResponse.json(updated);
}

// POST 完成盘点 — 更新 Item.quantity
export async function POST(request: Request, { params }: { params: { id: string } }) {
  // id = batchId
  const records = await prisma.stockTake.findMany({
    where: { batchId: params.id },
  });

  await Promise.all(
    records.map((r) =>
      prisma.item.update({
        where: { id: r.itemId },
        data: { quantity: r.actualQuantity },
      })
    )
  );

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: 编写盘点页面**

Write to `src/app/stocktake/page.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface StockTakeRecord {
  id: string;
  itemId: string;
  expectedQuantity: number;
  actualQuantity: number;
  difference: number;
  note: string | null;
  batchId: string;
  item: { id: string; code: string; name: string; unit: string; position: string | null };
}

interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

export default function StockTakePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [records, setRecords] = useState<StockTakeRecord[]>([]);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [viewBatch, setViewBatch] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const res = await fetch("/api/stocktake");
    setHistory(await res.json());
  };

  const startStockTake = async () => {
    const res = await fetch("/api/stocktake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: categoryId || null }),
    });
    const data = await res.json();
    setBatchId(data.batchId);
    setCompleted(false);
    loadRecords(data.batchId);
  };

  const loadRecords = async (bid: string) => {
    const res = await fetch(`/api/stocktake?batchId=${bid}`);
    setRecords(await res.json());
  };

  const updateRecord = async (id: string, actualQuantity: number, note: string) => {
    await fetch(`/api/stocktake/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actualQuantity, note }),
    });
  };

  const completeStockTake = async () => {
    if (!batchId) return;
    if (!confirm("确定完成盘点？库存将更新为实际数量。")) return;
    await fetch(`/api/stocktake/${batchId}`, { method: "POST" });
    setCompleted(true);
    loadHistory();
  };

  // 展示正在进行中的盘点
  if (batchId && !completed) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">盘点中</h1>
          <Button onClick={completeStockTake}>完成盘点</Button>
        </div>

        <div className="space-y-3">
          {records.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold">{r.item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {r.item.code} | {r.item.position ?? "位置未知"} | 账面: {r.expectedQuantity} {r.item.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      className="w-20"
                      value={r.actualQuantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        const newRecords = records.map((x) =>
                          x.id === r.id
                            ? { ...x, actualQuantity: val, difference: val - x.expectedQuantity }
                            : x
                        );
                        setRecords(newRecords);
                      }}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        updateRecord(r.id, val, r.note ?? "");
                      }}
                    />
                    <span className="text-sm text-muted-foreground">{r.item.unit}</span>
                    {r.difference !== 0 && (
                      <Badge variant={r.difference < 0 ? "destructive" : "default"}>
                        {r.difference > 0 ? "+" : ""}{r.difference}
                      </Badge>
                    )}
                    {r.difference === 0 && <Badge variant="outline">OK</Badge>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // 查看历史盘点批次详情
  if (viewBatch) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => { setViewBatch(null); }}>
            &larr; 返回
          </Button>
          <h1 className="text-2xl font-bold">盘点详情</h1>
        </div>
        <HistoryDetail batchId={viewBatch} />
      </div>
    );
  }

  // 发起盘点页面
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">盘点</h1>

      <Card className="mb-6">
        <CardHeader><CardTitle>发起新盘点</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="全盘（所有物料）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">全盘（所有物料）</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={startStockTake}>开始盘点</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>盘点历史</CardTitle></CardHeader>
        <CardContent>
          {history.map((batch) => (
            <div
              key={batch.batchId}
              className="flex justify-between items-center py-2 border-b last:border-0 cursor-pointer hover:bg-muted/50 px-2 rounded"
              onClick={() => setViewBatch(batch.batchId)}
            >
              <div>
                <p className="font-medium">
                  {new Date(batch._min.createdAt).toLocaleString("zh-CN")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {batch._count.id} 项物料
                </p>
              </div>
              <Button variant="ghost" size="sm">查看</Button>
            </div>
          ))}
          {history.length === 0 && (
            <p className="text-center text-muted-foreground py-4">暂无盘点记录</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function HistoryDetail({ batchId }: { batchId: string }) {
  const [records, setRecords] = useState<StockTakeRecord[]>([]);

  useEffect(() => {
    fetch(`/api/stocktake?batchId=${batchId}`)
      .then((r) => r.json())
      .then(setRecords);
  }, [batchId]);

  return (
    <div className="space-y-3">
      {records.map((r) => (
        <Card key={r.id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{r.item.name}</p>
                <p className="text-sm text-muted-foreground">{r.item.code}</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span>账面: {r.expectedQuantity}</span>
                <span>实际: {r.actualQuantity}</span>
                <Badge variant={r.difference !== 0 ? "destructive" : "outline"}>
                  {r.difference !== 0 ? (r.difference > 0 ? `+${r.difference}` : r.difference) : "一致"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "feat: add stock taking with batch start, update, complete and history"
```

---

### Task 12: 仪表盘

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/components/dashboard-stats.tsx`

- [ ] **Step 1: 编写仪表盘**

Write to `src/app/page.tsx`:
```tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [totalItems, totalValue, lowStockItems, expiringItems, recentTxns] =
    await Promise.all([
      prisma.item.count(),
      prisma.item.aggregate({
        _sum: { quantity: true },
        _count: true,
      }),
      // Prisma 不支持 where 中跨列比较，查出来后 JS 过滤
      prisma.item.findMany({
        where: { safetyStock: { gt: 0 } },
        orderBy: { quantity: "asc" },
      }).then((list) => list.filter((i) => i.quantity <= i.safetyStock).slice(0, 10)),
      prisma.item.findMany({
        where: {
          warrantyEnd: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { warrantyEnd: "asc" },
        take: 10,
      }),
      prisma.transaction.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { item: { select: { name: true, code: true, unit: true } } },
      }),
    ]);

  // 计算本月出入库
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthTxns = await prisma.transaction.groupBy({
    by: ["type"],
    where: { createdAt: { gte: startOfMonth } },
    _count: true,
  });
  const inCount = monthTxns.find((t) => t.type === "IN")?._count ?? 0;
  const outCount = monthTxns.find((t) => t.type === "OUT")?._count ?? 0;

  // 估算库存总值
  const items = await prisma.item.findMany({
    where: { price: { not: null } },
    select: { price: true, quantity: true },
  });
  const estimatedValue = items.reduce(
    (sum, i) => sum + (i.price ?? 0) * i.quantity, 0
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">仪表盘</h1>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">物料总数</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalItems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">库存总值</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">¥{estimatedValue.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">本月入库</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{inCount} 次</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">本月出库</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">{outCount} 次</p>
          </CardContent>
        </Card>
      </div>

      {/* 快捷操作 */}
      <div className="flex gap-3 mb-6">
        <Link href="/transactions/in">
          <Button>入库</Button>
        </Link>
        <Link href="/transactions/out">
          <Button variant="secondary">出库</Button>
        </Link>
        <Link href="/stocktake">
          <Button variant="outline">盘点</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 低库存预警 */}
        <Card>
          <CardHeader>
            <CardTitle>低库存预警</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <p className="text-muted-foreground text-sm">暂无低库存物料</p>
            ) : (
              <div className="space-y-2">
                {lowStockItems.map((item) => (
                  <Link key={item.id} href={`/items/${item.id}`}>
                    <div className="flex justify-between items-center py-1 hover:bg-muted/50 px-2 rounded">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted-foreground text-sm ml-2">
                          ({item.code})
                        </span>
                      </div>
                      <Badge variant="destructive">
                        {item.quantity}/{item.safetyStock} {item.unit}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 维保到期提醒 */}
        <Card>
          <CardHeader>
            <CardTitle>维保到期提醒（30天内）</CardTitle>
          </CardHeader>
          <CardContent>
            {expiringItems.length === 0 ? (
              <p className="text-muted-foreground text-sm">暂无即将到期的维保</p>
            ) : (
              <div className="space-y-2">
                {expiringItems.map((item) => {
                  const days = Math.ceil(
                    (new Date(item.warrantyEnd!).getTime() - Date.now()) / 86400000
                  );
                  return (
                    <Link key={item.id} href={`/items/${item.id}`}>
                      <div className="flex justify-between items-center py-1 hover:bg-muted/50 px-2 rounded">
                        <span className="font-medium">{item.name}</span>
                        <Badge variant={days < 7 ? "destructive" : "outline"}>
                          {days} 天后到期
                        </Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 最近出入库 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>最近出入库</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentTxns.map((txn) => (
              <div
                key={txn.id}
                className="flex justify-between items-center py-1 border-b last:border-0"
              >
                <div>
                  <Badge
                    variant={txn.type === "IN" ? "default" : "secondary"}
                    className="mr-2"
                  >
                    {txn.type === "IN" ? "入库" : "出库"}
                  </Badge>
                  <span>{txn.item.name}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {txn.quantity} {txn.item.unit}
                  {" "}
                  {new Date(txn.createdAt).toLocaleDateString("zh-CN")}
                </div>
              </div>
            ))}
            {recentTxns.length === 0 && (
              <p className="text-center text-muted-foreground py-4">暂无记录</p>
            )}
          </div>
          <Link href="/transactions/history" className="text-sm hover:underline mt-2 inline-block">
            查看全部 &rarr;
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "feat: add dashboard with stats, alerts, and quick actions"
```

---

### Task 13: 侧边栏导航与响应式布局

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/components/sidebar.tsx`

- [ ] **Step 1: 编写侧边栏组件**

Write to `src/components/sidebar.tsx`:
```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { href: "/", label: "仪表盘", icon: "📦" },
  { href: "/items", label: "物料管理", icon: "📋" },
  { href: "/transactions/in", label: "入库", icon: "📥" },
  { href: "/transactions/out", label: "出库", icon: "📤" },
  { href: "/transactions/history", label: "出入库记录", icon: "🔄" },
  { href: "/stocktake", label: "盘点", icon: "📊" },
  { href: "/categories", label: "分类管理", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const NavLinks = () => (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
            <Button
              variant={isActive ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </Button>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* 桌面端侧边栏 */}
      <aside className="hidden md:flex md:flex-col md:w-56 md:fixed md:inset-y-0 bg-background border-r">
        <div className="p-4 border-b">
          <h1 className="text-lg font-bold">备品备件</h1>
          <p className="text-xs text-muted-foreground">管理系统</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NavLinks />
        </div>
      </aside>

      {/* 手机端底部导航 + 抽屉 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50">
        <div className="flex justify-around py-2">
          {navItems.slice(0, 5).map((item) => (
            <Link key={item.href} href={item.href} className="flex flex-col items-center text-xs">
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] text-muted-foreground">{item.label}</span>
            </Link>
          ))}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center text-xs">
                <span className="text-lg">☰</span>
                <span className="text-[10px] text-muted-foreground">更多</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-56 p-3">
              <div className="p-4 border-b mb-3">
                <h1 className="text-lg font-bold">备品备件</h1>
                <p className="text-xs text-muted-foreground">管理系统</p>
              </div>
              <NavLinks />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: 更新根布局**

Modify `src/app/layout.tsx` (replace):
```tsx
import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "备品备件管理系统",
  description: "个人备品备件管理系统",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-background antialiased">
        <Sidebar />
        <main className="md:pl-56 pb-16 md:pb-0">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "feat: add sidebar navigation with responsive layout"
```

---

### Task 14: 数据备份与 CSV 导出

**Files:**
- Create: `src/app/api/backup/route.ts`
- Modify: `src/app/api/items/route.ts` (add export support)

- [ ] **Step 1: 编写备份下载 API**

Write to `src/app/api/backup/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import path from "path";

export async function GET() {
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  if (!existsSync(dbPath)) {
    return NextResponse.json({ error: "数据库文件不存在" }, { status: 404 });
  }

  const buffer = readFileSync(dbPath);
  const date = new Date().toISOString().split("T")[0];

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="backup-${date}.db"`,
    },
  });
}
```

- [ ] **Step 2: 编写 CSV 导出 API**

Create `src/app/api/items/export/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.item.findMany({
    include: { category: true },
    orderBy: { code: "asc" },
  });

  const headers = [
    "编号", "名称", "描述", "SN号", "型号", "厂商", "分类", "单位",
    "库存数量", "安全库存", "存放位置", "供应商", "参考单价",
    "维保起始", "维保截止", "SSD颗粒", "适用产品"
  ];

  const rows = items.map((i) => [
    i.code, i.name, i.description ?? "", i.sn ?? "", i.model ?? "",
    i.manufacturer ?? "", i.category.name, i.unit,
    String(i.quantity), String(i.safetyStock), i.position ?? "",
    i.supplier ?? "", i.price != null ? String(i.price) : "",
    i.warrantyStart?.toISOString().split("T")[0] ?? "",
    i.warrantyEnd?.toISOString().split("T")[0] ?? "",
    i.nandType ?? "", i.compatibleProducts ?? "",
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  // Add BOM for Excel Chinese support
  const bom = "﻿";

  return new NextResponse(bom + csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="items-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
```

- [ ] **Step 3: 在侧边栏添加备份入口**

Modify `src/components/sidebar.tsx` — add a bottom section with regular `<a>` tags (not `<Link>`, since these are API download routes):
```tsx
{/* 追加在 nav 结束之后，侧边栏最底部 */}
<div className="border-t p-3 space-y-1">
  <a href="/api/backup" className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted">
    <span>💾</span> 备份数据库
  </a>
  <a href="/api/items/export" className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted">
    <span>📄</span> 导出 CSV
  </a>
</div>
```tsx
```


- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "feat: add database backup download and CSV export"
```

---

### Task 15: 完善与收尾

**Files:**
- Create: `src/lib/utils.ts` (if not present)
- Modify: various files for edge cases

- [ ] **Step 1: 处理缺失的 shadcn 组件**

Verify all imported shadcn components exist:
```bash
npx shadcn@latest add popover tabs textarea calendar command
```

- [ ] **Step 2: 启动开发服务器并验证**

Run:
```bash
npm run dev
```

验证以下流程：
1. 创建分类 → 创建物料 → 入库 → 出库 → 查看记录 → 撤销记录 → 查看库存恢复
2. 发起盘点 → 修改数量 → 完成盘点 → 查看盘点历史
3. 仪表盘统计卡片和预警列表正确显示
4. 低库存预警触发
5. 维保到期提醒显示
6. 下载备份文件
7. 导出 CSV
8. 手机端响应式布局正常工作

- [ ] **Step 3: 修复发现的问题**

根据验证结果修复。

- [ ] **Step 4: 最终提交**

```bash
git add -A
git commit -m "feat: finalize spare parts management system"
```

---

## 附录：文件结构总览

```
beijian/
├── prisma/
│   ├── schema.prisma
│   └── dev.db
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    (仪表盘 - 服务端组件)
│   │   ├── globals.css
│   │   ├── items/
│   │   │   ├── page.tsx                (物料列表)
│   │   │   └── [id]/
│   │   │       └── page.tsx            (物料详情)
│   │   ├── transactions/
│   │   │   ├── in/page.tsx             (入库)
│   │   │   ├── out/page.tsx            (出库)
│   │   │   └── history/page.tsx        (出入库记录)
│   │   ├── stocktake/
│   │   │   └── page.tsx                (盘点)
│   │   ├── categories/
│   │   │   └── page.tsx                (分类管理)
│   │   └── api/
│   │       ├── items/
│   │       │   ├── route.ts            (GET list, POST create)
│   │       │   ├── [id]/route.ts       (GET, PUT, DELETE)
│   │       │   └── export/route.ts     (CSV export)
│   │       ├── transactions/
│   │       │   ├── route.ts            (GET list, POST batch)
│   │       │   └── [id]/route.ts       (DELETE undo)
│   │       ├── stocktake/
│   │       │   ├── route.ts            (GET list, POST start)
│   │       │   └── [id]/route.ts       (PUT update, POST complete)
│   │       ├── categories/
│   │       │   ├── route.ts            (GET, POST)
│   │       │   └── [id]/route.ts       (PUT, DELETE)
│   │       └── backup/
│   │           └── route.ts            (GET download DB)
│   ├── components/
│   │   ├── ui/                         (shadcn 组件)
│   │   ├── sidebar.tsx
│   │   ├── item-selector.tsx
│   │   ├── item-form-dialog.tsx
│   │   ├── category-form-dialog.tsx
│   │   └── transaction-form.tsx
│   └── lib/
│       ├── prisma.ts
│       └── utils.ts
├── tests/
│   └── api/
│       ├── categories.test.ts
│       └── items.test.ts
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── components.json
├── vitest.config.ts
├── .env
└── .gitignore
```
