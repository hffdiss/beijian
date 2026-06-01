"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BomFormDialog } from "@/components/bom-form-dialog";

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BomItem | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (q) params.set("q", q);
    if (materialCategory) params.set("materialCategory", materialCategory);
    const res = await fetch(`/api/boms?${params}`);
    setData(await res.json());
  }, [q, materialCategory, page]);

  const handleSearch = () => {
    setHasSearched(true);
    setPage(1);
    load();
  };

  useEffect(() => {
    if (hasSearched) {
      const timer = setTimeout(() => { load(); }, 300);
      return () => clearTimeout(timer);
    }
  }, [load, hasSearched]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">BOM管理</h1>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>新增BOM</Button>
      </div>

      <div className="flex gap-3 mb-4">
        <Input
          placeholder="输入关键词后按回车搜索..."
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="max-w-sm"
        />
        <Button variant="secondary" onClick={handleSearch}>搜索</Button>
      </div>

      {!hasSearched ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-lg font-medium mb-2">输入搜索条件开始查询</p>
          <p className="text-sm">支持 BBOM编码、名称、型号、厂商 等多词组合搜索</p>
        </div>
      ) : (
        <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>BBOM编码</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>型号</TableHead>
              <TableHead>物料类别</TableHead>
              <TableHead>厂商</TableHead>
              <TableHead>单位</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>部件数</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.boms.map((b) => (
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
                <TableCell><Badge variant="secondary">{b._count.parts}</Badge></TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(b); setDialogOpen(true); }}>编辑</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden space-y-3">
        {data.boms.map((b) => (
          <Card key={b.id}>
            <CardContent className="p-4">
              <Link href={`/boms/${b.id}`} className="font-mono font-semibold text-sm hover:underline">{b.bomCode}</Link>
              <p className="text-sm text-muted-foreground">{b.name ?? "-"}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">{b.materialCategory ?? "-"}</Badge>
                <Badge variant="secondary">{b._count.parts} 部件</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.total > 50 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>上一页</Button>
          <span className="text-sm text-muted-foreground self-center">{page} / {Math.ceil(data.total / 50)}</span>
          <Button variant="outline" size="sm" disabled={page * 50 >= data.total} onClick={() => setPage((p) => p + 1)}>下一页</Button>
        </div>
      )}

        </>
      )}
      <BomFormDialog open={dialogOpen} onOpenChange={setDialogOpen} bom={editing} onSaved={load} />
    </div>
  );
}
