import type { PrismaClient } from "@/generated/prisma/client";

function excelSerialToDate(serial: number): Date | null {
  if (serial < 1 || serial > 2958465) return null;
  return new Date((serial - 25569) * 86400 * 1000);
}

function parseDate(value: unknown): Date | null {
  if (typeof value === "number") return excelSerialToDate(value);
  if (typeof value === "string" && value.trim()) {
    const d = new Date(value.trim());
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function strVal(v: unknown): string {
  return String(v ?? "").trim();
}

function intVal(v: unknown): number | null {
  const n = parseInt(String(v));
  return isNaN(n) ? null : n;
}

function floatVal(v: unknown): number | null {
  if (typeof v === "number") return v;
  const n = parseFloat(String(v));
  return isNaN(n) ? null : n;
}

function boolVal(v: unknown): boolean {
  return strVal(v) === "是";
}

export interface ImportResult {
  projects: number;
  machines: number;
  boms: number;
  parts: number;
  errors: string[];
}

export async function importFromXlsx(
  filePath: string,
  prisma: PrismaClient
): Promise<ImportResult> {
  const fs = require("fs");
  const XLSX = require("xlsx");
  const buf = fs.readFileSync(filePath);
  const wb = XLSX.read(buf, { type: "buffer" });
  const result: ImportResult = { projects: 0, machines: 0, boms: 0, parts: 0, errors: [] };

  // ── Step 1: Import BOM from Sheet 2 "新增BOM" ──
  const bomSheet = wb.Sheets["新增BOM"];
  if (bomSheet) {
    const bomRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(bomSheet, { header: 1, defval: "" });
    for (let i = 1; i < bomRows.length; i++) {
      const r = bomRows[i] as unknown[];
      const bomCode = strVal(r[2]);
      if (!bomCode) continue;
      try {
        const bomData = {
          sbomCode: strVal(r[1]) || null,
          materialCategory: strVal(r[6]).replace(/^_/, "") || null,
          materialSubcategory: strVal(r[7]).replace(/^\d+/, "").trim() || null,
          model: strVal(r[8]) || null,
          name: strVal(r[9]) || null,
          unit: strVal(r[10]) || null,
          quantity: parseInt(String(r[11])) || 1,
          lifecycle: strVal(r[12]) || null,
          effectiveDate: parseDate(r[13]),
          expiryDate: parseDate(r[14]),
          isSpare: strVal(r[15]) === "是",
          detailDescription: strVal(r[16]) || null,
          manufacturer: strVal(r[17]) || null,
          manufacturerModel: strVal(r[18]) || null,
          supplier: strVal(r[19]) || null,
          processCode: strVal(r[20]) || null,
          status: strVal(r[5]) || null,
          remark: strVal(r[21]) || null,
        };
        await prisma.bom.upsert({
          where: { bomCode },
          create: { bomCode, ...bomData },
          update: bomData,
        });
        result.boms++;
      } catch (e) {
        result.errors.push(`BOM row ${i}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  // ── Step 2: Read Sheet 1 rows ──
  const sheet = wb.Sheets["发货项目清单(含BBOM SN)"];
  if (!sheet) return result;
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][];

  // ── Step 3: Upsert projects ──
  const projectMap = new Map<string, { city: string; contractNumber: string; oem: string; implDate: Date | null; warrantyStart: Date | null; warrantyEnd: Date | null; projectSla: string }>();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const name = strVal(r[0]);
    if (!name || projectMap.has(name)) continue;
    projectMap.set(name, {
      city: strVal(r[5]),
      contractNumber: strVal(r[6]),
      oem: strVal(r[1]),
      implDate: parseDate(r[2]),
      warrantyStart: parseDate(r[3]),
      warrantyEnd: parseDate(r[4]),
      projectSla: strVal(r[26]),
    });
  }

  for (const [name, info] of projectMap) {
    const projectData = {
      city: info.city || null,
      contractNumber: info.contractNumber || null,
      oem: info.oem || null,
      implementationDate: info.implDate,
      warrantyStart: info.warrantyStart,
      warrantyEnd: info.warrantyEnd,
      projectSla: info.projectSla || null,
    };
    try {
      await prisma.project.upsert({
        where: { name },
        create: { name, ...projectData },
        update: projectData,
      });
      result.projects++;
    } catch (e) {
      result.errors.push(`Project "${name}": ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // ── Step 4: Upsert machines ──
  const machineMap = new Map<string, { manufacturerSn: string; product: string; modelCode: string; manufacturer: string; projectName: string }>();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const sn = strVal(r[7]);
    if (!sn || machineMap.has(sn)) continue;
    machineMap.set(sn, {
      manufacturerSn: strVal(r[8]),
      product: strVal(r[19]),
      modelCode: strVal(r[20]),
      manufacturer: strVal(r[21]),
      projectName: strVal(r[0]),
    });
  }

  for (const [sn, info] of machineMap) {
    const machineData = {
      manufacturerSn: info.manufacturerSn || null,
      product: info.product || null,
      modelCode: info.modelCode || null,
      manufacturer: info.manufacturer || null,
      projectId: undefined as string | undefined,
    };
    try {
      await prisma.machine.upsert({
        where: { machineSn: sn },
        create: {
          machineSn: sn,
          manufacturerSn: machineData.manufacturerSn,
          product: machineData.product,
          modelCode: machineData.modelCode,
          manufacturer: machineData.manufacturer,
          project: { connect: { name: info.projectName } },
        },
        update: {
          manufacturerSn: machineData.manufacturerSn,
          product: machineData.product,
          modelCode: machineData.modelCode,
          manufacturer: machineData.manufacturer,
        },
      });
      result.machines++;
    } catch (e) {
      result.errors.push(`Machine "${sn}": ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // ── Step 5: Sync BOM codes from Sheet 1 ──
  const sheet1BomCodes = new Set<string>();
  for (let i = 1; i < rows.length; i++) {
    const code = strVal(rows[i][10]);
    if (code) sheet1BomCodes.add(code);
  }
  for (const code of sheet1BomCodes) {
    try {
      await prisma.bom.upsert({
        where: { bomCode: code },
        create: { bomCode: code },
        update: {},
      });
    } catch { /* skip */ }
  }

  // ── Step 6: Insert parts (pre-fetch referential IDs) ──
  const [projectRecords, machineRecords] = await Promise.all([
    prisma.project.findMany({ select: { id: true, name: true } }),
    prisma.machine.findMany({ select: { id: true, machineSn: true } }),
  ]);
  const projectIdBy = new Map(projectRecords.map((p) => [p.name, p.id]));
  const machineIdBy = new Map(machineRecords.map((m) => [m.machineSn, m.id]));

  let count = 0;
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const partSn = strVal(r[14]);
    if (!partSn) continue;

    const projectName = strVal(r[0]);
    const machineSn = strVal(r[7]);
    const bomCode = strVal(r[10]);

    const partData = {
      projectId: projectName ? projectIdBy.get(projectName) ?? null : null,
      machineId: machineSn ? machineIdBy.get(machineSn) ?? null : null,
      bomCode: bomCode || null,
      description: strVal(r[13]) || null,
      model: strVal(r[15]) || null,
      subModel: strVal(r[16]) || null,
      nandType: strVal(r[17]) || null,
      firmwareVersion: strVal(r[18]) || null,
      equipmentCategory: strVal(r[11]) || null,
      purchaseDate: parseDate(r[9]),
      projectWarrantyMonths: intVal(r[23]),
      supplierWarrantyMonths: intVal(r[24]),
      postStartupWarrantyMonths: floatVal(r[25]),
      projectSla: strVal(r[26]) || null,
      supplierSla: strVal(r[27]) || null,
      supplier: strVal(r[22]) || null,
      failureRate: floatVal(r[12]),
      isSpare: boolVal(r[28]),
      spareResponsible: strVal(r[32]) || null,
      spareQuantity: intVal(r[33]) ?? 0,
      spareWarehouse: strVal(r[34]) || null,
      spareStrategy: strVal(r[35]) || null,
      spareStatus: strVal(r[36]) || null,
      monthGap: strVal(r[29]) === "是" ? true : strVal(r[29]) === "否" ? false : null,
      gapMonths: floatVal(r[30]),
      slaGap: strVal(r[31]) === "是" ? true : strVal(r[31]) === "否" ? false : null,
      remark: strVal(r[37]) || null,
    };
    try {
      await prisma.part.upsert({
        where: { partSn },
        create: { partSn, ...partData },
        update: partData,
      });
      count++;
    } catch (e) {
      result.errors.push(`Part "${partSn}" row ${i}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  result.parts = count;

  return result;
}
