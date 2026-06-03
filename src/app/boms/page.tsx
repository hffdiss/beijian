"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BomFormDialog } from "@/components/bom-form-dialog";
import { Pagination } from "@/components/pagination";
import { Breadcrumb } from "@/components/breadcrumb";
import { TableSkeleton } from "@/components/skeleton";

interface BomItem {
  id: string;
  bomCode: string;
  name: string | null;
  model: string | null;
  manufacturer: string | null;
  materialCategory: string | null;
  unit: string | null;
  isSpare: boolean;
  status: string | null;
  lifecycle: string | null;
  _count: { parts: number; items: number };
}

export default function BomsPage() {
  const [data, setData] = useState<{ boms: BomItem[]; total: number }>({ boms: [], total: 0 });
  const [q, setQ] = useState("");
  const [materialCategory, setMaterialCategory] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BomItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("bomCode");
  const [dir, setDir] = useState<"asc" | "desc">("asc");

  const toggleSort = (field: string) => {
    if (sort === field) { setDir((d) => (d === "asc" ? "desc" : "asc")); }
    else { setSort(field); setDir("asc"); }
    setPage(1);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit), sort, dir });
    if (q) params.set("q", q);
    if (materialCategory) params.set("materialCategory", materialCategory);
    const res = await fetch(`/api/boms?${params}`);
    setData(await res.json());
    setLoading(false);
  }, [q, materialCategory, page, limit, sort, dir]);

  const handleSearch = () => {
    setPage(1);
    load();
  };

  useEffect(() => {
    const timer = setTimeout(() => { load(); }, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const handleDelete = async (bom: BomItem) => {
    if (!confirm(`确定删除 "${bom.bomCode}"？`)) return;
    const res = await fetch(`/api/boms/${bom.id}`, { method: "DELETE" });
    if (!res.ok) { const err = await res.json(); alert(err.error); return; }
    load();
  };

  const totalPages = Math.ceil(data.total / limit);

  const SortHead = ({ field, label }: { field: string; label: string }) => (
    <TableHead className="cursor-pointer hover:bg-muted/50 select-none" onClick={() => toggleSort(field)}>
      <span className="inline-flex items-center gap-1">{label}{sort === field && <span className="text-xs">{dir === "asc" ? "▲" : "▼"}</span>}</span>
    </TableHead>
  );

  // Client-side sort for count fields
  const sortedData = { ...data };
  if ((sort === "parts" || sort === "items") && data.boms.length > 0) {
    sortedData.boms = [...data.boms].sort((a, b) => {
      const va = sort === "parts" ? a._count.parts : a._count.items;
      const vb = sort === "parts" ? b._count.parts : b._count.items;
      return dir === "asc" ? va - vb : vb - va;
    });
  }
  const displayBoms = (sort === "parts" || sort === "items") ? sortedData.boms : data.boms;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Breadcrumb items={[{ label: "BOM管理" }]} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">BOM管理</h1>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>新增BOM</Button>
      </div>

      <div className="flex gap-3 mb-4">
        <Input
          placeholder="输入关键词搜索（BBOM/名称/型号/厂商）..."
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="max-w-sm"
        />
        <Select
          value={materialCategory || "null"}
          onValueChange={(v) => { setMaterialCategory(!v || v === "null" ? "" : v); setPage(1); }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="物料类别" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="null">全部类别</SelectItem>
            <SelectItem value="0B包装材料">包装材料</SelectItem>
            <SelectItem value="0C存储介质">存储介质</SelectItem>
            <SelectItem value="0E交换机">交换机</SelectItem>
            <SelectItem value="0J结构件">结构件</SelectItem>
            <SelectItem value="0K板卡">板卡</SelectItem>
            <SelectItem value="0N内存">内存</SelectItem>
            <SelectItem value="0R软件">软件</SelectItem>
            <SelectItem value="0X处理器">处理器</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="secondary" onClick={handleSearch}>搜索</Button>
      </div>

      {loading ? (
        <TableSkeleton rows={limit > 10 ? 10 : limit} cols={9} />
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortHead field="bomCode" label="BBOM编码" />
                  <SortHead field="name" label="名称" />
                  <SortHead field="model" label="型号" />
                  <SortHead field="materialCategory" label="物料类别" />
                  <SortHead field="manufacturer" label="厂商" />
                  <SortHead field="unit" label="单位" />
                  <SortHead field="status" label="状态" />
                  <SortHead field="parts" label="关联数" />
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayBoms.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-sm">
                      <Link href={`/boms/${b.id}`} className="hover:underline">{b.bomCode}</Link>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{b.name ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{b.model ?? "-"}</TableCell>
                    <TableCell><Badge variant="outline">{b.materialCategory ?? "-"}</Badge></TableCell>
                    <TableCell>{b.manufacturer ?? "-"}</TableCell>
                    <TableCell>{b.unit ?? "-"}</TableCell>
                    <TableCell>{b.status ?? b.lifecycle ?? "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 text-xs">
                        <Badge variant="secondary">{b._count.parts} 部件</Badge>
                        {b._count.items > 0 && <Badge variant="outline">{b._count.items} 物料</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditing(b); setDialogOpen(true); }}>编辑</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(b)}>删除</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden space-y-3">
            {displayBoms.map((b) => (
              <Card key={b.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link href={`/boms/${b.id}`} className="font-mono font-semibold text-sm hover:underline">{b.bomCode}</Link>
                      <p className="text-sm text-muted-foreground">{b.name ?? "-"}</p>
                    </div>
                    <Badge variant="secondary">{b._count.parts} 部件</Badge>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{b.materialCategory ?? "-"}</Badge>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { setEditing(b); setDialogOpen(true); }}>编辑</Button>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => handleDelete(b)}>删除</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {data.boms.length === 0 && (
            <p className="text-center text-muted-foreground py-12">暂无BOM</p>
          )}

          <Pagination
            page={page} totalPages={totalPages} total={data.total} limit={limit}
            onPageChange={setPage} onLimitChange={setLimit}
          />
        </>
      )}

      <BomFormDialog open={dialogOpen} onOpenChange={setDialogOpen} bom={editing} onSaved={load} />
    </div>
  );
}
