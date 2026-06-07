import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "0");

  const where: Record<string, unknown> = {};
  if (q) {
    const terms = q.trim().split(/\s+/).filter((t) => t.length > 0);
    if (terms.length > 0) {
      where.AND = terms.map((term) => ({
        OR: [
          { name: { contains: term } },
          { code: { contains: term } },
          { model: { contains: term } },
          { sn: { contains: term } },
          { description: { contains: term } },
          { manufacturer: { contains: term } },
          { position: { contains: term } },
          { supplier: { contains: term } },
          { nandType: { contains: term } },
          { compatibleProducts: { contains: term } },
        ],
      }));
    }
  }
  if (categoryId) {
    where.categoryId = categoryId;
  }

  const sort = searchParams.get("sort") ?? "updatedAt";
  const dir = (searchParams.get("dir") ?? "desc") === "desc" ? "desc" : "asc";
  const sortMap: Record<string, unknown> = {
    code: { code: dir },
    name: { name: dir },
    model: { model: dir },
    category: { category: { name: dir } },
    quantity: { quantity: dir },
    position: { position: dir },
    updatedAt: { updatedAt: dir },
  };

  const effectiveLimit = limit > 0 ? limit : 50;
  const skip = (page - 1) * effectiveLimit;

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where,
      include: { category: true },
      orderBy: sortMap[sort] ?? { updatedAt: "desc" },
      skip,
      take: effectiveLimit,
    }),
    prisma.item.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, limit: effectiveLimit });
}

export async function POST(request: Request) {
  const data = await request.json();

  if (!data.code || !data.name || !data.categoryId || !data.unit) {
    return NextResponse.json(
      { error: "编号、名称、分类和单位不能为空" },
      { status: 400 }
    );
  }

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
