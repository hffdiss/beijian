"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PartFormDialog } from "@/components/part-form-dialog";
import { TableSkeleton } from "@/components/skeleton";
import { Breadcrumb } from "@/components/breadcrumb";
import { Pagination } from "@/components/pagination";
import { useToast } from "@/components/toast";

interface PartItem {
  id: string;
  partSn: string;
  description: string | null;
  model: string | null;
  isSpare: boolean;
  spareStatus: string | null;
  spareWarehouse: string | null;
  project: { name: string } | null;
  machine: { machineSn: string } | null;
  bom: { name: string | null } | null;
}

interface Stats {
  total: number;
  byCategory: { equipmentCategory: string | null; _count: number }[];
  byStatus: { spareStatus: string | null; _count: number }[];
  byWarehouse: { spareWarehouse: string | null; _count: number }[];
  bySpare: { isSpare: boolean; _count: number }[];
}

const COLUMNS = [
  { key: "partSn", label: "部件SN", default: true },
  { key: "description", label: "描述", default: true },
  { key: "model", label: "型号", default: true },
  { key: "project", label: "项目", default: true },
  { key: "machine", label: "机器SN", default: false },
  { key: "isSpare", label: "备件", default: true },
  { key: "spareStatus", label: "状态", default: true },
  { key: "spareWarehouse", label: "库房", default: true },
];

const SAVED_VIEWS_KEY = "beijian_parts_views";

export default function PartsPage() {
  const toast = useToast();
  const [data, setData] = useState<{ parts: PartItem[]; total: number }>({ parts: [], total: 0 });
  const [stats, setStats] = useState<Stats | null>(null);
  const [q, setQ] = useState("");
  const [spareStatus, setSpareStatus] = useState("");
  const [spareWarehouse, setSpareWarehouse] = useState("");
  const [isSpare, setIsSpare] = useState("");
  const [equipmentCategory, setEquipmentCategory] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [visibleCols, setVisibleCols] = useState(new Set(COLUMNS.filter((c) => c.default).map((c) => c.key)));
  const [showColPicker, setShowColPicker] = useState(false);
  const [savedViews, setSavedViews] = useState<{ name: string; params: Record<string, string> }[]>([]);
  const [isTableFixed, setIsTableFixed] = useState(false);
  const colWidthsRef = useRef<Record<string, number>>({});
  const dragRef = useRef<{ field: string; startX: number; startWidth: number } | null>(null);
  type Tick = number;
  const [, setColTick] = useState<Tick>(0);

  const buildParams = (prefix: string) => {
    const p: Record<string, string> = {};
    if (q) p[`${prefix}q`] = q;
    if (spareStatus) p[`${prefix}spareStatus`] = spareStatus;
    if (spareWarehouse) p[`${prefix}spareWarehouse`] = spareWarehouse;
    if (isSpare) p[`${prefix}isSpare`] = isSpare;
    if (equipmentCategory) p[`${prefix}equipmentCategory`] = equipmentCategory;
    return p;
  };

  const loadStats = useCallback(async () => {
    const current = buildParams("");
    const params = new URLSearchParams(current);
    const res = await fetch(`/api/parts/stats?${params}`);
    setStats(await res.json());
  }, [q, spareStatus, spareWarehouse, isSpare, equipmentCategory]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit), ...buildParams("") });
    const res = await fetch(`/api/parts?${params}`);
    setData(await res.json());
    setLoading(false);
  }, [q, spareStatus, spareWarehouse, isSpare, equipmentCategory, page, limit]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => {
    const timer = setTimeout(() => { load(); }, 200);
    return () => clearTimeout(timer);
  }, [load]);

  // Saved views
  useEffect(() => {
    try { setSavedViews(JSON.parse(localStorage.getItem(SAVED_VIEWS_KEY) ?? "[]")); } catch {}
  }, []);

  const saveView = () => {
    const name = prompt("给当前筛选视图命名：");
    if (!name) return;
    const params = buildParams("");
    const updated = [...savedViews.filter((v) => v.name !== name), { name, params }];
    setSavedViews(updated);
    localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(updated));
  };

  const loadView = (view: { name: string; params: Record<string, string> }) => {
    setQ(view.params.q ?? "");
    setSpareStatus(view.params.spareStatus ?? "");
    setSpareWarehouse(view.params.spareWarehouse ?? "");
    setIsSpare(view.params.isSpare ?? "");
    setEquipmentCategory(view.params.equipmentCategory ?? "");
    setPage(1);
  };

  const deleteView = (name: string) => {
    const updated = savedViews.filter((v) => v.name !== name);
    setSavedViews(updated);
    localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(updated));
  };

  const clearFilters = () => { setQ(""); setSpareStatus(""); setSpareWarehouse(""); setIsSpare(""); setEquipmentCategory(""); setPage(1); };

  const toggleCol = (key: string) => {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const exportUrl = `/api/parts/export?${new URLSearchParams(buildParams("")).toString()}`;
  const totalPages = Math.ceil(data.total / limit);

  const drillDown = (field: string, value: string) => {
    if (field === "equipmentCategory") setEquipmentCategory(value);
    else if (field === "spareStatus") setSpareStatus(value);
    else if (field === "spareWarehouse") setSpareWarehouse(value);
    else if (field === "isSpare") setIsSpare(value);
    setPage(1);
  };

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

  const ResizableTh = ({ field, label, className }: { field: string; label: string; className?: string }) => {
    const width = colWidthsRef.current[field];
    return (
      <TableHead data-field={field} className={`relative select-none ${className ?? ""}`} style={width ? { width, minWidth: 40 } : undefined}>
        {label}
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
      <Breadcrumb items={[{ label: "部件管理" }]} />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">部件管理</h1>
        <div className="flex gap-2">
          <a href={exportUrl} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm">📥 导出当前</Button>
          </a>
          <Button variant="outline" size="sm" onClick={saveView}>💾 保存视图</Button>
          <Button onClick={() => setCreateOpen(true)}>新增部件</Button>
        </div>
      </div>

      {/* Saved views */}
      {savedViews.length > 0 && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs text-muted-foreground">视图:</span>
          {savedViews.map((v) => (
            <div key={v.name} className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => loadView(v)}>{v.name}</Button>
              <button onClick={() => deleteView(v.name)} className="text-muted-foreground hover:text-destructive text-xs">&times;</button>
            </div>
          ))}
        </div>
      )}

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Card className="cursor-pointer hover:shadow-sm transition-shadow" onClick={clearFilters}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">总计</p>
            </CardContent>
          </Card>
          {stats.byStatus.slice(0, 3).map((s) => (
            <Card key={s.spareStatus ?? "null"} className={`cursor-pointer hover:shadow-sm transition-shadow ${spareStatus === s.spareStatus ? "ring-2 ring-primary" : ""}`}
              onClick={() => drillDown("spareStatus", s.spareStatus ?? "")}>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold">{s._count}</p>
                <p className="text-xs text-muted-foreground">{s.spareStatus || "未知"}</p>
              </CardContent>
            </Card>
          ))}
          {stats.byWarehouse.filter((w) => w.spareWarehouse && w.spareWarehouse !== "不涉及").slice(0, 2).map((w) => (
            <Card key={w.spareWarehouse!} className={`cursor-pointer hover:shadow-sm transition-shadow ${spareWarehouse === w.spareWarehouse ? "ring-2 ring-primary" : ""}`}
              onClick={() => drillDown("spareWarehouse", w.spareWarehouse ?? "")}>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold">{w._count}</p>
                <p className="text-xs text-muted-foreground">{w.spareWarehouse}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Input placeholder="多词搜索..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="max-w-sm" />
        <Select value={equipmentCategory || ""} onValueChange={(v) => { setEquipmentCategory(!v ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="类别" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部类别</SelectItem>
            {stats?.byCategory.filter((c) => c.equipmentCategory).map((c) => (
              <SelectItem key={c.equipmentCategory!} value={c.equipmentCategory!}>{c.equipmentCategory} ({c._count})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={spareStatus || ""} onValueChange={(v) => { setSpareStatus(!v ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="状态" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部</SelectItem>
            {stats?.byStatus.filter((s) => s.spareStatus).map((s) => (
              <SelectItem key={s.spareStatus!} value={s.spareStatus!}>{s.spareStatus} ({s._count})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={spareWarehouse || ""} onValueChange={(v) => { setSpareWarehouse(!v ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="库房" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部</SelectItem>
            {stats?.byWarehouse.filter((w) => w.spareWarehouse).map((w) => (
              <SelectItem key={w.spareWarehouse!} value={w.spareWarehouse!}>{w.spareWarehouse} ({w._count})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={isSpare || ""} onValueChange={(v) => { setIsSpare(!v ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-32"><SelectValue placeholder="备件" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部</SelectItem>
            <SelectItem value="true">是</SelectItem>
            <SelectItem value="false">否</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="secondary" size="sm" onClick={clearFilters}>清除</Button>

        {/* Column picker */}
        <div className="relative">
          <Button variant="outline" size="sm" onClick={() => setShowColPicker(!showColPicker)}>📋 列</Button>
          {showColPicker && (
            <div className="absolute top-full mt-1 right-0 bg-popover border rounded-lg shadow-lg p-2 z-10 w-36">
              {COLUMNS.map((c) => (
                <label key={c.key} className="flex items-center gap-2 px-2 py-1 text-sm cursor-pointer hover:bg-muted rounded">
                  <input type="checkbox" checked={visibleCols.has(c.key)} onChange={() => toggleCol(c.key)} className="w-3.5 h-3.5" />
                  {c.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={limit > 10 ? 10 : limit} cols={visibleCols.size + 1} />
      ) : (
        <>
          <div className="hidden md:block">
            <Table className={isTableFixed ? "table-fixed" : ""}>
              <TableHeader>
                <TableRow>
                  {visibleCols.has("partSn") && <ResizableTh field="partSn" label="部件SN" />}
                  {visibleCols.has("description") && <ResizableTh field="description" label="描述" className="max-w-[300px]" />}
                  {visibleCols.has("model") && <ResizableTh field="model" label="型号" />}
                  {visibleCols.has("project") && <ResizableTh field="project" label="项目" className="max-w-[200px]" />}
                  {visibleCols.has("machine") && <ResizableTh field="machine" label="机器SN" />}
                  {visibleCols.has("isSpare") && <ResizableTh field="isSpare" label="备件" />}
                  {visibleCols.has("spareStatus") && <ResizableTh field="spareStatus" label="状态" />}
                  {visibleCols.has("spareWarehouse") && <ResizableTh field="spareWarehouse" label="库房" />}
                  <TableHead className="relative">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.parts.map((p) => (
                  <TableRow key={p.id}>
                    {visibleCols.has("partSn") && <TableCell className="font-mono text-sm"><div className="truncate"><Link href={`/parts/${p.id}`} className="hover:underline">{p.partSn}</Link></div></TableCell>}
                    {visibleCols.has("description") && <TableCell className="text-muted-foreground max-w-[300px]"><div className="truncate">{p.description ?? "-"}</div></TableCell>}
                    {visibleCols.has("model") && <TableCell className="text-muted-foreground"><div className="truncate">{p.model ?? "-"}</div></TableCell>}
                    {visibleCols.has("project") && <TableCell className="text-sm max-w-[200px]"><div className="truncate">{p.project?.name ?? "-"}</div></TableCell>}
                    {visibleCols.has("machine") && <TableCell className="font-mono text-xs text-muted-foreground"><div className="truncate">{p.machine?.machineSn ?? "-"}</div></TableCell>}
                    {visibleCols.has("isSpare") && <TableCell><div className="truncate">{p.isSpare ? <Badge>是</Badge> : <Badge variant="outline">否</Badge>}</div></TableCell>}
                    {visibleCols.has("spareStatus") && <TableCell><Badge variant={p.spareStatus === "NG" ? "destructive" : "secondary"}>{p.spareStatus ?? "-"}</Badge></TableCell>}
                    {visibleCols.has("spareWarehouse") && <TableCell className="text-muted-foreground text-sm"><div className="truncate">{p.spareWarehouse ?? "-"}</div></TableCell>}
                    <TableCell>
                      <div className="flex gap-1">
                        <Link href={`/parts/${p.id}`}><Button variant="ghost" size="sm">编辑</Button></Link>
                        <Button variant="ghost" size="sm" onClick={() => {
                          if (!confirm(`确定删除 "${p.partSn}"？`)) return;
                          fetch(`/api/parts/${p.id}`, { method: "DELETE" }).then((r) => {
                            if (!r.ok) r.json().then((e: { error: string }) => toast.error(e.error));
                            else load();
                          });
                        }}>删除</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden space-y-3">
            {data.parts.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4">
                  <Link href={`/parts/${p.id}`} className="font-mono font-semibold text-sm hover:underline">{p.partSn}</Link>
                  <p className="text-sm text-muted-foreground truncate">{p.description ?? "-"}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{p.project?.name ?? "-"}</Badge>
                    <Badge variant={p.spareStatus === "NG" ? "destructive" : "secondary"}>{p.spareStatus ?? "-"}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {data.parts.length === 0 && <p className="text-center text-muted-foreground py-12">暂无部件</p>}

          <Pagination page={page} totalPages={totalPages} total={data.total} limit={limit}
            onPageChange={setPage} onLimitChange={setLimit} />
        </>
      )}

      <PartFormDialog open={createOpen} onOpenChange={setCreateOpen} onSaved={load} />
    </div>
  );
}
