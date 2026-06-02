"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumb } from "@/components/breadcrumb";
import { TableSkeleton } from "@/components/skeleton";
import { Pagination } from "@/components/pagination";

interface Machine {
  id: string;
  machineSn: string;
  manufacturerSn: string | null;
  product: string | null;
  modelCode: string | null;
  manufacturer: string | null;
  project: { name: string };
  _count: { parts: number };
}

export default function MachinesPage() {
  const [data, setData] = useState<{ machines: Machine[]; total: number }>({ machines: [], total: 0 });
  const [q, setQ] = useState("");
  const [projectId, setProjectId] = useState("");
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects").then((r) => r.json()).then(setProjects);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q) params.set("q", q);
    if (projectId) params.set("projectId", projectId);
    const res = await fetch(`/api/machines?${params}`);
    const json = await res.json();
    setData(Array.isArray(json) ? { machines: json, total: json.length } : json);
    setLoading(false);
  }, [q, projectId, page, limit]);

  const handleSearch = () => {
    setPage(1);
    load();
  };

  useEffect(() => {
    const timer = setTimeout(() => { load(); }, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const totalPages = Math.ceil(data.total / limit);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Breadcrumb items={[{ label: "机器管理" }]} />
      <h1 className="text-2xl font-bold mb-6">机器管理</h1>

      <div className="flex gap-3 mb-4">
        <Input
          placeholder="输入机器SN或产品名搜索..."
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="max-w-sm"
        />
        <Select
          value={projectId || "null"}
          onValueChange={(v) => { setProjectId(!v || v === "null" ? "" : v); setPage(1); }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="全部项目" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="null">全部项目</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="secondary" onClick={handleSearch}>搜索</Button>
      </div>

      {loading ? (
        <TableSkeleton rows={limit > 10 ? 10 : limit} cols={7} />
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>整机SN</TableHead>
                  <TableHead>厂商SN</TableHead>
                  <TableHead>产品</TableHead>
                  <TableHead>型号代码</TableHead>
                  <TableHead>厂商</TableHead>
                  <TableHead>项目</TableHead>
                  <TableHead>部件数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.machines.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-sm">
                      <Link href={`/machines/${m.id}`} className="hover:underline">{m.machineSn}</Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{m.manufacturerSn ?? "-"}</TableCell>
                    <TableCell>{m.product ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{m.modelCode ?? "-"}</TableCell>
                    <TableCell>{m.manufacturer ?? "-"}</TableCell>
                    <TableCell>
                      <Link href={`/projects/${m.project.name}`} className="text-sm hover:underline">{m.project.name}</Link>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{m._count.parts}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden space-y-3">
            {data.machines.map((m) => (
              <Card key={m.id}>
                <CardContent className="p-4">
                  <Link href={`/machines/${m.id}`} className="font-mono font-semibold text-sm hover:underline">{m.machineSn}</Link>
                  <p className="text-sm text-muted-foreground">{m.product ?? "-"} | {m.manufacturer ?? "-"}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{m.project.name}</Badge>
                    <Badge variant="secondary">{m._count.parts} 部件</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {data.machines.length === 0 && (
            <p className="text-center text-muted-foreground py-12">未找到机器</p>
          )}

          {/* Pagination */}
          <Pagination
            page={page} totalPages={totalPages} total={data.total} limit={limit}
            onPageChange={setPage} onLimitChange={setLimit}
          />
        </>
      )}
    </div>
  );
}
