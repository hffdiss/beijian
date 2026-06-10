"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumb } from "@/components/breadcrumb";
import { TableSkeleton } from "@/components/skeleton";
import { useToast } from "@/components/toast";
import { MachineFormDialog } from "@/components/machine-form-dialog";
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
  const toast = useToast();
  const [data, setData] = useState<{ machines: Machine[]; total: number }>({ machines: [], total: 0 });
  const [q, setQ] = useState("");
  const [projectId, setProjectId] = useState("");
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("machineSn");
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Machine | null>(null);
  const [isTableFixed, setIsTableFixed] = useState(false);
  const colWidthsRef = useRef<Record<string, number>>({});
  const dragRef = useRef<{ field: string; startX: number; startWidth: number } | null>(null);
  type Tick = number;
  const [, setColTick] = useState<Tick>(0);

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

  const handleDelete = async (m: Machine) => {
    if (!confirm(`确定删除机器"${m.machineSn}"？`)) return;
    const res = await fetch(`/api/machines/${m.id}`, { method: "DELETE" });
    if (!res.ok) { const err = await res.json(); toast.error(err.error); return; }
    toast.success(`已删除"${m.machineSn}"`);
    load();
  };

  const handleSearch = () => { setPage(1); load(); };

  useEffect(() => {
    const timer = setTimeout(() => { load(); }, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const totalPages = Math.ceil(data.total / limit);

  // Column resize
  const onDragStart = (field: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const th = (e.currentTarget as HTMLElement).closest("th") as HTMLElement;
    const startWidth = th.offsetWidth;
    dragRef.current = { field, startX: e.clientX, startWidth };
    setIsTableFixed(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const diff = ev.clientX - dragRef.current.startX;
      colWidthsRef.current[dragRef.current.field] = Math.max(40, dragRef.current.startWidth + diff);
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

  const SortHead = ({ field, label, className }: { field: string; label: string; className?: string }) => {
    const width = colWidthsRef.current[field];
    return (
      <TableHead data-field={field} className={`cursor-pointer hover:bg-muted/50 select-none relative ${className ?? ""}`} onClick={() => toggleSort(field)} style={width ? { width, minWidth: 40 } : undefined}>
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">机器管理</h1>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>新增机器</Button>
      </div>

      <div className="flex gap-3 mb-4">
        <Input
          placeholder="输入机器SN或产品名搜索..."
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="max-w-sm"
        />
        <Select
          value={projectId || ""}
          onValueChange={(v) => { setProjectId(!v ? "" : v); setPage(1); }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="全部项目" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部项目</SelectItem>
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
            <Table className={isTableFixed ? "table-fixed" : ""}>
              <TableHeader>
                <TableRow>
                  <SortHead field="machineSn" label="整机SN" />
                  <SortHead field="manufacturerSn" label="厂商SN" />
                  <SortHead field="product" label="产品" className="max-w-[200px]" />
                  <SortHead field="modelCode" label="型号代码" />
                  <SortHead field="manufacturer" label="厂商" />
                  <SortHead field="project" label="项目" className="max-w-[200px]" />
                  <SortHead field="parts" label="部件数" />
                  <TableHead className="relative">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(sort === "parts" ? sortedData.machines : data.machines).map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-sm"><div className="truncate" title={m.machineSn}><Link href={`/machines/${m.id}`} className="hover:underline">{m.machineSn}</Link></div></TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-[180px]"><div className="truncate" title={m.manufacturerSn ?? ""}>{m.manufacturerSn ?? "-"}</div></TableCell>
                    <TableCell className="max-w-[200px]"><div className="truncate" title={m.product ?? ""}>{m.product ?? "-"}</div></TableCell>
                    <TableCell className="text-muted-foreground"><div className="truncate" title={m.modelCode ?? ""}>{m.modelCode ?? "-"}</div></TableCell>
                    <TableCell><div className="truncate" title={m.manufacturer ?? ""}>{m.manufacturer ?? "-"}</div></TableCell>
                    <TableCell className="max-w-[200px]"><div className="truncate" title={m.project.name}><Link href={`/projects`} className="text-sm hover:underline">{m.project.name}</Link></div></TableCell>
                    <TableCell><Badge variant="secondary">{m._count.parts}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditing(m); setDialogOpen(true); }}>编辑</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(m)}>删除</Button>
                      </div>
                    </TableCell>
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

      <MachineFormDialog open={dialogOpen} onOpenChange={setDialogOpen} machine={editing} onSaved={load} />
    </div>
  );
}
