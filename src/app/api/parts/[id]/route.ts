import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const part = await prisma.part.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true, city: true, contractNumber: true } },
      machine: { select: { id: true, machineSn: true, product: true } },
      bom: true,
    },
  });
  if (!part) {
    return NextResponse.json({ error: "部件不存在" }, { status: 404 });
  }
  return NextResponse.json(part);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await request.json();

  try {
    const part = await prisma.part.update({
      where: { id },
      data: {
        projectId: data.projectId !== undefined ? data.projectId || null : undefined,
        machineId: data.machineId !== undefined ? data.machineId || null : undefined,
        bomCode: data.bomCode !== undefined ? data.bomCode || null : undefined,
        description: data.description,
        model: data.model,
        subModel: data.subModel,
        nandType: data.nandType,
        firmwareVersion: data.firmwareVersion,
        equipmentCategory: data.equipmentCategory,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : data.purchaseDate === null ? null : undefined,
        projectWarrantyMonths: data.projectWarrantyMonths,
        supplierWarrantyMonths: data.supplierWarrantyMonths,
        postStartupWarrantyMonths: data.postStartupWarrantyMonths,
        projectSla: data.projectSla,
        supplierSla: data.supplierSla,
        supplier: data.supplier,
        failureRate: data.failureRate,
        isSpare: data.isSpare,
        spareResponsible: data.spareResponsible,
        spareQuantity: data.spareQuantity,
        spareWarehouse: data.spareWarehouse,
        spareStrategy: data.spareStrategy,
        spareStatus: data.spareStatus,
        monthGap: data.monthGap,
        gapMonths: data.gapMonths,
        slaGap: data.slaGap,
        remark: data.remark,
      },
      include: { project: { select: { id: true, name: true, city: true, contractNumber: true } }, machine: { select: { id: true, machineSn: true, product: true } }, bom: true },
    });
    return NextResponse.json(part);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "更新失败";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.part.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "部件不存在" }, { status: 404 });
  }
}
