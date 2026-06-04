import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "fs";
import path from "path";

// Read the existing beijian.xlsx as template, or generate a minimal one
export async function GET() {
  // Try to use beijian.xlsx as the template (first 2 rows for headers + 1 sample)
  const filePath = path.join(process.cwd(), "beijian.xlsx");
  if (existsSync(filePath)) {
    const buf = readFileSync(filePath);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="beijian-template.xlsx"`,
      },
    });
  }

  // Fallback: generate a minimal CSV template
  const bomHeaders = ["序号","SBOM编码","BBOM编码","层次","编码类别","编码状态","物料大类","物料小类","型号","描述","单位","数量","生命周期","生效日期","失效日期","备件","详细描述","制造商","制造商型号","供应商","工序代号","备注"];
  const itemHeaders = ["项目","OEM/厂家","项目实施时间","与泛联售前确认起保日期","项目维保截止日","项目城市","泛联合同号","泛联整机SN","厂商整机SN","部件购买时间","BBOM编码","类别","年故障率","描述","部件序列号（SN）","硬盘型号","子型号","硬盘颗粒","固件版本","产品","型号代码","整机厂商","供应商","项目质保月","供应商质保月","项目启动后供应商质保月","项目SLA","供应商SLA","是否备件","月份是否GAP","GAP(月）","SLA是否GAP","备件责任主体","泛联备件数量","备件库房","备件策略","备件状态","备注"];

  const csv = ["新增BOM", bomHeaders.join(","), ...bomHeaders.map(() => "").slice(0, 2).map(() => ""),
    "", "发货项目清单(含BBOM SN)", itemHeaders.join(","), ...itemHeaders.map(() => "").slice(0, 2).map(() => "")].join("\n");

  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="beijian-template.csv"`,
    },
  });
}
