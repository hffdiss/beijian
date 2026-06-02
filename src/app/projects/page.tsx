"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProjectFormDialog } from "@/components/project-form-dialog";
import { Breadcrumb } from "@/components/breadcrumb";
import { TableSkeleton } from "@/components/skeleton";

interface Project {
  id: string;
  name: string;
  city: string | null;
  contractNumber: string | null;
  oem: string | null;
  warrantyEnd: string | null;
  _count: { machines: number; parts: number };
}

type SortField = "name" | "city" | "contractNumber" | "oem" | "warrantyEnd" | "machines" | "parts";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [q, setQ] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [sort, setSort] = useState<SortField>("name");
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);

  const toggleSort = (field: SortField) => {
    if (sort === field) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSort(field);
      setDir("asc");
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ sort, dir });
    if (q) params.set("q", q);

    // Sort counts client-side
    if (sort === "machines" || sort === "parts") {
      const res = await fetch("/api/projects");
      let data: Project[] = await res.json();
      data = [...data].sort((a, b) => {
        const va = sort === "machines" ? a._count.machines : a._count.parts;
        const vb = sort === "machines" ? b._count.machines : b._count.parts;
        return dir === "asc" ? va - vb : vb - va;
      });
      if (q) {
        const lower = q.toLowerCase();
        data = data.filter((p) =>
          p.name.toLowerCase().includes(lower) ||
          (p.city ?? "").toLowerCase().includes(lower) ||
          (p.contractNumber ?? "").toLowerCase().includes(lower)
        );
      }
      setProjects(data);
    } else {
      const res = await fetch(`/api/projects?${params}`);
      setProjects(await res.json());
    }
    setLoading(false);
  }, [q, sort, dir]);

  useEffect(() => {
    const timer = setTimeout(() => { load(); }, 200);
    return () => clearTimeout(timer);
  }, [load]);

  const SortHead = ({ field, label }: { field: SortField; label: string }) => (
    <TableHead className="cursor-pointer hover:bg-muted/50 select-none" onClick={() => toggleSort(field)}>
      <span className="inline-flex items-center gap-1">
        {label}
        {sort === field && (
          <span className="text-xs">{dir === "asc" ? "▲" : "▼"}</span>
        )}
      </span>
    </TableHead>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Breadcrumb items={[{ label: "项目管理" }]} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">项目管理</h1>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>新增项目</Button>
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

      {loading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortHead field="name" label="项目名称" />
                  <SortHead field="city" label="城市" />
                  <SortHead field="contractNumber" label="合同号" />
                  <SortHead field="oem" label="OEM" />
                  <SortHead field="machines" label="机器数" />
                  <SortHead field="parts" label="部件数" />
                  <SortHead field="warrantyEnd" label="维保截止" />
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
        </>
      )}

      <ProjectFormDialog open={dialogOpen} onOpenChange={setDialogOpen} project={editing} onSaved={load} />
    </div>
  );
}
