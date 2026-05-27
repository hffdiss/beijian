"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Project {
  id: string;
  name: string;
  city: string | null;
  contractNumber: string | null;
  oem: string | null;
  warrantyEnd: string | null;
  _count: { machines: number; parts: number };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const res = await fetch(`/api/projects?${params}`);
    setProjects(await res.json());
  }, [q]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">项目管理</h1>
      </div>

      <div className="flex gap-3 mb-4">
        <Input
          placeholder="搜索项目名称/城市/合同号..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          className="max-w-sm"
        />
        <Button variant="secondary" onClick={load}>搜索</Button>
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>项目名称</TableHead>
              <TableHead>城市</TableHead>
              <TableHead>合同号</TableHead>
              <TableHead>OEM</TableHead>
              <TableHead>机器数</TableHead>
              <TableHead>部件数</TableHead>
              <TableHead>维保截止</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Link href={`/projects/${p.id}`} className="hover:underline font-medium">
                    {p.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{p.city ?? "-"}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{p.contractNumber ?? "-"}</TableCell>
                <TableCell>{p.oem ?? "-"}</TableCell>
                <TableCell><Badge variant="secondary">{p._count.machines}</Badge></TableCell>
                <TableCell><Badge variant="secondary">{p._count.parts}</Badge></TableCell>
                <TableCell className="text-sm">
                  {p.warrantyEnd ? new Date(p.warrantyEnd).toLocaleDateString("zh-CN") : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-3">
        {projects.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-4">
              <Link href={`/projects/${p.id}`} className="font-semibold hover:underline">
                {p.name}
              </Link>
              <div className="flex gap-2 mt-2 text-sm text-muted-foreground">
                <span>{p.city ?? "-"}</span>
                <Badge variant="outline">{p._count.machines} 机器</Badge>
                <Badge variant="outline">{p._count.parts} 部件</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {projects.length === 0 && (
        <p className="text-center text-muted-foreground py-12">暂无项目</p>
      )}
    </div>
  );
}
