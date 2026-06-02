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
  const [sort, setSort] = useState("machineSn");
  const [dir, setDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    fetch("/api/projects").then((r) => r.json()).then(setProjects);
  }, []);

  const toggleSort = (field: string) => {
    if (sort === field) { setDir((d) => (d === "asc" ? "desc" : "asc")); }
    else { setSort(field); setDir("asc"); }
    setPage(1);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit), sort, dir });
    if (q) params.set("q", q);
    if (projectId) params.set("projectId", projectId);
    const res = await fetch(`/api/machines?${params}`);
    const json = await res.json();
    setData(Array.isArray(json) ? { machines: json, total: json.length } : json);
    setLoading(false);
  }, [q, projectId, page, limit, sort, dir]);

  const handleSearch = () => {
    setPage(1);
    load();
  };

  useEffect(() => {
    const timer = setTimeout(() => { load(); }, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const totalPages = Math.ceil(data.total / limit);

  const SortHead = ({ field, label }: { field: string; label: string }) => (
    <TableHead className="cursor-pointer hover:bg-muted/50 select-none" onClick={() => toggleSort(field)}>
      <span className="inline-flex items-center gap-1">
        {label}
        {sort === field && <span className="text-xs">{dir === "asc" ? "▲" : "▼"}</span>}
      </span>
    </TableHead>
  );

  // Client-side sort for parts count (aggregation field)
  const sortedData = { ...data };
  if (sort === "parts" && data.machines.length > 0) {
    sortedData.machines = [...data.machines].sort((a, b) =>
      dir === "asc" ? a._count.parts - b._count.parts : b._count.parts - a._count.parts
    );
  }

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
                  <SortHead field="machineSn" label="整机SN" />
                  <SortHead field="manufacturerSn" label="厂商SN" />
                  <SortHead field="product" label="产品" />
                  <SortHead field="modelCode" label="型号代码" />
                  <SortHead field="manufacturer" label="厂商" />
                  <SortHead field="project" label="项目" />
                  <SortHead field="parts" label="部件数" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(sort === "parts" ? sortedData.machines : data.machines).map((m) => (
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
            {(sort === "parts" ? sortedData.machines : data.machines).map((m) => (
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
