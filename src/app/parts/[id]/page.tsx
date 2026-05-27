"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Bom {
  id: string; bomCode: string; sbomCode: string | null; name: string | null;
  model: string | null; subModel: string | null; manufacturer: string | null;
  manufacturerModel: string | null; materialCategory: string | null;
  materialSubcategory: string | null; category: string | null;
  unit: string | null; quantity: number; nandType: string | null;
  firmwareVersion: string | null; lifecycle: string | null;
  effectiveDate: string | null; expiryDate: string | null;
  supplier: string | null; detailDescription: string | null;
  processCode: string | null; status: string | null;
  isSpare: boolean; remark: string | null;
}

interface Part {
  id: string; partSn: string; description: string | null;
  model: string | null; spareStatus: string | null;
  project: { name: string } | null;
  machine: { machineSn: string; product: string | null } | null;
}

interface PartDetail {
  id: string; partSn: string;
  project: { id: string; name: string; city: string | null; contractNumber: string | null } | null;
  machine: { id: string; machineSn: string; product: string | null } | null;
  bom: Bom | null;
  description: string | null; model: string | null; subModel: string | null;
  nandType: string | null; firmwareVersion: string | null;
  equipmentCategory: string | null;
  purchaseDate: string | null;
  projectWarrantyMonths: number | null; supplierWarrantyMonths: number | null;
  postStartupWarrantyMonths: number | null;
  projectSla: string | null; supplierSla: string | null;
  supplier: string | null; failureRate: number | null;
  isSpare: boolean; spareResponsible: string | null;
  spareQuantity: number; spareWarehouse: string | null;
  spareStrategy: string | null; spareStatus: string | null;
  monthGap: boolean | null; gapMonths: number | null; slaGap: boolean | null;
  remark: string | null;
}

export default function PartDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [part, setPart] = useState<PartDetail | null>(null);

  useEffect(() => {
    fetch(`/api/parts/${id}`).then((r) => r.json()).then(setPart);
  }, [id]);

  if (!part) return <div className="p-6">加载中...</div>;

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("zh-CN") : "-";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/parts"><Button variant="ghost" size="sm">&larr; 返回</Button></Link>
        <h1 className="text-2xl font-bold font-mono">{part.partSn}</h1>
        {part.isSpare && <Badge>备件</Badge>}
        {part.spareStatus && <Badge variant={part.spareStatus === "NG" ? "destructive" : "secondary"}>{part.spareStatus}</Badge>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">项目</CardTitle></CardHeader>
          <CardContent>
            {part.project ? (
              <Link href={`/projects/${part.project.id}`} className="font-semibold hover:underline text-sm">{part.project.name}</Link>
            ) : "-"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">机器</CardTitle></CardHeader>
          <CardContent>
            {part.machine ? (
              <Link href={`/machines/${part.machine.id}`} className="font-mono font-semibold hover:underline text-sm">{part.machine.machineSn}</Link>
            ) : "-"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">备件库房</CardTitle></CardHeader>
          <CardContent><p className="font-semibold">{part.spareWarehouse ?? "-"}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">备件数量</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{part.spareQuantity}</p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle>规格信息</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">描述:</span> {part.description ?? "-"}</div>
              <div><span className="text-muted-foreground">型号:</span> {part.model ?? "-"}</div>
              <div><span className="text-muted-foreground">子型号:</span> {part.subModel ?? "-"}</div>
              <div><span className="text-muted-foreground">类别:</span> {part.equipmentCategory ?? "-"}</div>
              <div><span className="text-muted-foreground">NAND颗粒:</span> {part.nandType ?? "-"}</div>
              <div><span className="text-muted-foreground">固件版本:</span> {part.firmwareVersion ?? "-"}</div>
              <div><span className="text-muted-foreground">供应商:</span> {part.supplier ?? "-"}</div>
              <div><span className="text-muted-foreground">年故障率:</span> {part.failureRate != null ? `${part.failureRate}%` : "-"}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>维保与SLA</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">购买日期:</span> {formatDate(part.purchaseDate)}</div>
              <div><span className="text-muted-foreground">项目质保月:</span> {part.projectWarrantyMonths ?? "-"}</div>
              <div><span className="text-muted-foreground">供应商质保月:</span> {part.supplierWarrantyMonths ?? "-"}</div>
              <div><span className="text-muted-foreground">启动后质保月:</span> {part.postStartupWarrantyMonths ?? "-"}</div>
              <div><span className="text-muted-foreground">项目SLA:</span> {part.projectSla ?? "-"}</div>
              <div><span className="text-muted-foreground">供应商SLA:</span> {part.supplierSla ?? "-"}</div>
              <div><span className="text-muted-foreground">月份GAP:</span> {part.monthGap === true ? "是" : part.monthGap === false ? "否" : "-"}</div>
              <div><span className="text-muted-foreground">GAP(月):</span> {part.gapMonths ?? "-"}</div>
              <div><span className="text-muted-foreground">SLA GAP:</span> {part.slaGap === true ? "是" : part.slaGap === false ? "否" : "-"}</div>
              <div><span className="text-muted-foreground">备件责任主体:</span> {part.spareResponsible ?? "-"}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle>备件信息</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">备件策略:</span> {part.spareStrategy ?? "-"}</div>
              <div><span className="text-muted-foreground">备注:</span> {part.remark ?? "-"}</div>
            </div>
          </CardContent>
        </Card>

        {part.bom && (
          <Card>
            <CardHeader><CardTitle>关联BOM</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">BBOM编码:</span> <span className="font-mono">{part.bom.bomCode}</span></div>
                <div><span className="text-muted-foreground">名称:</span> {part.bom.name ?? "-"}</div>
                <div><span className="text-muted-foreground">型号:</span> {part.bom.model ?? "-"}</div>
                <div><span className="text-muted-foreground">物料大类:</span> {part.bom.materialCategory ?? "-"}</div>
                <div><span className="text-muted-foreground">物料小类:</span> {part.bom.materialSubcategory ?? "-"}</div>
                <div><span className="text-muted-foreground">厂商:</span> {part.bom.manufacturer ?? "-"}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
