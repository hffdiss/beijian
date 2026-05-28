"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BomFormDialog } from "@/components/bom-form-dialog";

interface Part {
  id: string; partSn: string; description: string | null;
  spareStatus: string | null; spareWarehouse: string | null;
  project: { name: string } | null;
}

interface BomDetail {
  id: string; bomCode: string; sbomCode: string | null;
  name: string | null; model: string | null; subModel: string | null;
  manufacturer: string | null; manufacturerModel: string | null;
  materialCategory: string | null; materialSubcategory: string | null;
  category: string | null; unit: string | null; quantity: number;
  nandType: string | null; firmwareVersion: string | null;
  lifecycle: string | null; supplier: string | null;
  detailDescription: string | null; processCode: string | null;
  status: string | null; isSpare: boolean; remark: string | null;
  _count: { parts: number; items: number };
  parts: Part[];
}

export default function BomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [bom, setBom] = useState<BomDetail | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const load = () => { fetch(`/api/boms/${id}`).then((r) => r.json()).then(setBom); };
  useEffect(() => { load(); }, [id]);

  if (!bom) return <div className="p-6">加载中...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/boms"><Button variant="ghost" size="sm">&larr; 返回</Button></Link>
        <h1 className="text-2xl font-bold font-mono">{bom.bomCode}</h1>
        {bom.isSpare && <Badge>备件</Badge>}
        {bom.status && <Badge variant="outline">{bom.status}</Badge>}
        <div className="flex-1" />
        <Button variant="outline" onClick={() => setEditOpen(true)}>编辑</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">关联部件</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{bom._count.parts}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">关联物料</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{bom._count.items}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">单位</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{bom.unit ?? "-"}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">数量</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{bom.quantity}</p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle>基本信息</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">SBOM编码:</span> {bom.sbomCode ?? "-"}</div>
              <div><span className="text-muted-foreground">名称:</span> {bom.name ?? "-"}</div>
              <div><span className="text-muted-foreground">型号:</span> {bom.model ?? "-"}</div>
              <div><span className="text-muted-foreground">子型号:</span> {bom.subModel ?? "-"}</div>
              <div><span className="text-muted-foreground">物料大类:</span> {bom.materialCategory ?? "-"}</div>
              <div><span className="text-muted-foreground">物料小类:</span> {bom.materialSubcategory ?? "-"}</div>
              <div><span className="text-muted-foreground">类别:</span> {bom.category ?? "-"}</div>
              <div><span className="text-muted-foreground">厂商:</span> {bom.manufacturer ?? "-"}</div>
              <div><span className="text-muted-foreground">厂商型号:</span> {bom.manufacturerModel ?? "-"}</div>
              <div><span className="text-muted-foreground">供应商:</span> {bom.supplier ?? "-"}</div>
              <div><span className="text-muted-foreground">NAND:</span> {bom.nandType ?? "-"}</div>
              <div><span className="text-muted-foreground">固件版本:</span> {bom.firmwareVersion ?? "-"}</div>
              <div><span className="text-muted-foreground">生命周期:</span> {bom.lifecycle ?? "-"}</div>
              <div><span className="text-muted-foreground">工序代号:</span> {bom.processCode ?? "-"}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>详细描述</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{bom.detailDescription || bom.remark || "无"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>关联部件 ({bom.parts.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>部件SN</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>项目</TableHead>
                <TableHead>备件状态</TableHead>
                <TableHead>库房</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bom.parts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-sm">
                    <Link href={`/parts/${p.id}`} className="hover:underline">{p.partSn}</Link>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{p.description ?? "-"}</TableCell>
                  <TableCell className="text-sm">{p.project?.name ?? "-"}</TableCell>
                  <TableCell><Badge variant="outline">{p.spareStatus ?? "-"}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{p.spareWarehouse ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <BomFormDialog open={editOpen} onOpenChange={setEditOpen} bom={bom} onSaved={load} />
    </div>
  );
}
