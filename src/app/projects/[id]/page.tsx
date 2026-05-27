"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Machine {
  id: string;
  machineSn: string;
  product: string | null;
  modelCode: string | null;
  manufacturer: string | null;
  _count: { parts: number };
}

interface Part {
  id: string;
  partSn: string;
  description: string | null;
  spareStatus: string | null;
  bom: { bomCode: string; name: string | null } | null;
}

interface Project {
  id: string;
  name: string;
  city: string | null;
  contractNumber: string | null;
  oem: string | null;
  warrantyEnd: string | null;
  projectSla: string | null;
  remark: string | null;
  _count: { machines: number; parts: number };
  machines: Machine[];
  parts: Part[];
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then(setProject);
  }, [id]);

  if (!project) return <div className="p-6">加载中...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/projects"><Button variant="ghost" size="sm">&larr; 返回</Button></Link>
        <h1 className="text-2xl font-bold">{project.name}</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">机器数</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{project._count.machines}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">部件数</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{project._count.parts}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">城市</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{project.city ?? "-"}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">维保截止</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xl font-bold">
              {project.warrantyEnd ? new Date(project.warrantyEnd).toLocaleDateString("zh-CN") : "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
        <div><span className="text-muted-foreground">合同号:</span> {project.contractNumber ?? "-"}</div>
        <div><span className="text-muted-foreground">OEM:</span> {project.oem ?? "-"}</div>
        <div><span className="text-muted-foreground">SLA:</span> {project.projectSla ?? "-"}</div>
        <div><span className="text-muted-foreground">备注:</span> {project.remark ?? "-"}</div>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>机器列表 ({project.machines.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>整机SN</TableHead>
                <TableHead>产品</TableHead>
                <TableHead>型号代码</TableHead>
                <TableHead>厂商</TableHead>
                <TableHead>部件数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {project.machines.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-sm">
                    <Link href={`/machines/${m.id}`} className="hover:underline">{m.machineSn}</Link>
                  </TableCell>
                  <TableCell>{m.product ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{m.modelCode ?? "-"}</TableCell>
                  <TableCell>{m.manufacturer ?? "-"}</TableCell>
                  <TableCell><Badge variant="outline">{m._count.parts}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>最近部件</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>部件SN</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>BBOM</TableHead>
                <TableHead>备件状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {project.parts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-sm">
                    <Link href={`/parts/${p.id}`} className="hover:underline">{p.partSn}</Link>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">{p.description ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{p.bom?.bomCode ?? "-"}</TableCell>
                  <TableCell><Badge variant="outline">{p.spareStatus ?? "-"}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
