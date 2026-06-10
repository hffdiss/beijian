"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProjectFormDialog } from "@/components/project-form-dialog";
import { Breadcrumb } from "@/components/breadcrumb";
import { TableSkeleton } from "@/components/skeleton";
import { useToast } from "@/components/toast";

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
  const toast = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [q, setQ] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [sort, setSort] = useState<SortField>("name");
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  const [isTableFixed, setIsTableFixed] = useState(false);

  const toggleSort = (field: SortField) => {
    if (sort === field) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSort(field); setDir("asc"); }
  };

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ sort, dir });
    if (q) params.set("q", q);

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
        data = data.filter((p) => p.name.toLowerCase().includes(lower) || (p.city ?? "").toLowerCase().includes(lower) || (p.contractNumber ?? "").toLowerCase().includes(lower));
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

  const handleDelete = async (p: Project) => {
    if (!confirm(`确定删除项目"${p.name}"？`)) return;
    const res = await fetch(`/api/projects/${p.id}`, { method: "DELETE" });
    if (!res.ok) { const err = await res.json(); toast.error(err.error); return; }
    toast.success(`已删除"${p.name}"`);
    load();
  };

  // Stats
  const stats = {
    total: projects.length,
    totalMachines: projects.reduce((s, p) => s + p._count.machines, 0),
    totalParts: projects.reduce((s, p) => s + p._count.parts, 0),
    expiring30: projects.filter((p) => p.warrantyEnd && new Date(p.warrantyEnd) <= new Date(Date.now() + 30 * 86400000) && new Date(p.warrantyEnd) >= new Date()).length,
  };

  const warrantyColor = (d: string | null) => {
    if (!d) return "";
    const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
    if (days < 0) return "text-destructive font-semibold";
    if (days <= 30) return "text-destructive";
    if (days <= 90) return "text-amber-600";
    return "";
  };

  const colWidthsRef = useRef<Record<string, number>>({});
  const dragRef = useRef<{ field: string; startX: number; startWidth: number } | null>(null);

  const onDragStart = (field: string, e: React.MouseEvent) => {
    e.preventDefault();
    const th = (e.currentTarget as HTMLElement).closest("th") as HTMLElement;
    const startWidth = th.offsetWidth;
    dragRef.current = { field, startX: e.clientX, startWidth };
    setIsTableFixed(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const diff = ev.clientX - dragRef.current.startX;
      const newWidth = Math.max(40, dragRef.current.startWidth + diff);
      colWidthsRef.current[dragRef.current.field] = newWidth;
      setColTick((t) => t + 1);
    };
    const onUp = () => {
      dragRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const onAutoFit = (field: string) => {
    const table = document.querySelector('[data-slot="table"]');
    if (!table) return;
    const headerTh = table.querySelector(`th[data-field="${field}"]`) as HTMLElement | null;
    if (!headerTh) return;
    const allTh = Array.from(table.querySelectorAll("thead tr th"));
    const idx = allTh.indexOf(headerTh);
    if (idx === -1) return;
    let maxW = 0;
    // Clone each cell off-screen to measure true content width regardless of current column constraint
    for (const cell of [headerTh, ...table.querySelectorAll("tbody tr")]) {
      const el = idx === 0 ? (cell as HTMLElement) : ((cell as HTMLElement).querySelectorAll("td")[idx] as HTMLElement | undefined);
      if (!el) continue;
      const clone = el.cloneNode(true) as HTMLElement;
      clone.style.cssText = "position:fixed;top:-9999px;left:-9999px;visibility:hidden;width:auto;height:auto;white-space:nowrap";
      document.body.appendChild(clone);
      maxW = Math.max(maxW, clone.scrollWidth);
      document.body.removeChild(clone);
    }
    colWidthsRef.current[field] = Math.ceil(maxW) + 4;
    setColTick((t) => t + 1);
  };

  type Tick = number;
  const [, setColTick] = useState<Tick>(0);

  const SortHead = ({ field, label }: { field: SortField; label: string }) => {
    const width = colWidthsRef.current[field];
    return (
      <TableHead data-field={field} className="cursor-pointer hover:bg-muted/50 select-none relative" onClick={() => toggleSort(field)} style={width ? { width, minWidth: 40 } : undefined}>
        <span className="inline-flex items-center gap-1">{label}{sort === field && <span className="text-xs">{dir === "asc" ? "▲" : "▼"}</span>}</span>
        <div
          className="absolute top-0 right-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 z-10"
          onMouseDown={(e) => { e.stopPropagation(); onDragStart(field, e); }}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => { e.stopPropagation(); onAutoFit(field); }}
        />
      </TableHead>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Breadcrumb items={[{ label: "项目管理" }]} />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">项目管理</h1>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>新增项目</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">项目数</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold">{stats.totalMachines}</p><p className="text-xs text-muted-foreground">机器总数</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold">{stats.totalParts}</p><p className="text-xs text-muted-foreground">部件总数</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className={`text-xl font-bold ${stats.expiring30 > 0 ? "text-destructive" : ""}`}>{stats.expiring30}</p><p className="text-xs text-muted-foreground">30天内到期</p></CardContent></Card>
      </div>

      <div className="flex gap-3 mb-4">
        <Input placeholder="搜索项目名称/城市/合同号..." value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()} className="max-w-sm" />
        <Button variant="secondary" onClick={load}>搜索</Button>
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={8} />
      ) : (
        <>
          <div className="hidden md:block">
            <Table className={isTableFixed ? "table-fixed" : ""}>
              <TableHeader>
                <TableRow>
                  <SortHead field="name" label="项目名称" />
                  <SortHead field="city" label="城市" />
                  <SortHead field="contractNumber" label="合同号" />
                  <SortHead field="oem" label="OEM" />
                  <SortHead field="machines" label="机器数" />
                  <SortHead field="parts" label="部件数" />
                  <SortHead field="warrantyEnd" label="维保截止" />
                  <TableHead className="relative">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="truncate">
                        <Link href={`/projects/${p.id}`} className="hover:underline font-medium">{p.name}</Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground"><div className="truncate">{p.city ?? "-"}</div></TableCell>
                    <TableCell className="text-muted-foreground text-sm"><div className="truncate">{p.contractNumber ?? "-"}</div></TableCell>
                    <TableCell><div className="truncate">{p.oem ?? "-"}</div></TableCell>
                    <TableCell><Badge variant="secondary">{p._count.machines}</Badge></TableCell>
                    <TableCell><Badge variant="secondary">{p._count.parts}</Badge></TableCell>
                    <TableCell className={`text-sm ${warrantyColor(p.warrantyEnd)}`}>
                      {p.warrantyEnd ? new Date(p.warrantyEnd).toLocaleDateString("zh-CN") : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditing(p); setDialogOpen(true); }}>编辑</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(p)}>删除</Button>
                      </div>
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
                  <Link href={`/projects/${p.id}`} className="font-semibold hover:underline">{p.name}</Link>
                  <div className="flex gap-2 mt-2 text-sm text-muted-foreground">
                    <span>{p.city ?? "-"}</span>
                    <Badge variant="outline">{p._count.machines} 机器</Badge>
                    <Badge variant="outline">{p._count.parts} 部件</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {projects.length === 0 && <p className="text-center text-muted-foreground py-12">暂无项目</p>}
        </>
      )}

      <ProjectFormDialog open={dialogOpen} onOpenChange={setDialogOpen} project={editing} onSaved={() => { load(); toast.success("保存成功"); }} />
    </div>
  );
}
