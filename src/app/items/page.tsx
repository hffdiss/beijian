"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ItemFormDialog } from "@/components/item-form-dialog";

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  _count?: { items: number };
}

interface Item {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sn: string | null;
  model: string | null;
  manufacturer: string | null;
  categoryId: string;
  unit: string;
  quantity: number;
  safetyStock: number;
  position: string | null;
  supplier: string | null;
  price: number | null;
  warrantyStart: string | null;
  warrantyEnd: string | null;
  nandType: string | null;
  compatibleProducts: string | null;
  bomCode: string | null;
  category: Category;
}

export default function ItemsPage() {
  const [data, setData] = useState<{ items: Item[]; total: number }>({ items: [], total: 0 });
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const loadItems = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: "30" });
    if (q) params.set("q", q);
    if (categoryId) params.set("categoryId", categoryId);
    const res = await fetch(`/api/items?${params}`);
    const json = await res.json();
    setData(Array.isArray(json) ? { items: json, total: json.length } : json);
  }, [q, categoryId, page]);

  const loadCategories = async () => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  };

  useEffect(() => { loadCategories(); }, []);

  const handleSearch = () => {
    setHasSearched(true);
    setPage(1);
    loadItems();
  };

  useEffect(() => {
    if (hasSearched) {
      const timer = setTimeout(() => { loadItems(); }, 300);
      return () => clearTimeout(timer);
    }
  }, [loadItems, hasSearched]);

  const handleDelete = async (item: Item) => {
    if (!confirm(`确定删除物料 "${item.name}"？`)) return;
    const res = await fetch(`/api/items/${item.id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error);
      return;
    }
    loadItems();
  };

  const categoryName = (cat: Category) =>
    cat.parentId ? `  └ ${cat.name}` : cat.name;

  const categoriesFlat = categories.flatMap((c) => {
    const result = [c];
    const children = categories.filter((x) => x.parentId === c.id);
    result.push(...children);
    return result;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">物料管理</h1>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          新增物料
        </Button>
      </div>

      <div className="flex gap-3 mb-4">
        <Input
          placeholder="输入关键词后按回车搜索..."
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="max-w-sm"
        />
        <Select
          value={categoryId || "null"}
          onValueChange={(v) => {
            setCategoryId(!v || v === "null" ? "" : v);
            setPage(1);
            setHasSearched(true);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="全部分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="null">全部分类</SelectItem>
            {categoriesFlat.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {categoryName(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="secondary" onClick={handleSearch}>搜索</Button>
      </div>

      {!hasSearched ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-lg font-medium mb-2">输入搜索条件开始查询</p>
          <p className="text-sm">支持按名称、编号、型号、SN、描述 等多词搜索，也可按分类筛选</p>
        </div>
      ) : (
        <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>编号</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>型号</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>BOM</TableHead>
              <TableHead>库存</TableHead>
              <TableHead>位置</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-sm">{item.code}</TableCell>
                <TableCell>
                  <Link href={`/items/${item.id}`} className="hover:underline">
                    {item.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{item.model ?? "-"}</TableCell>
                <TableCell><Badge variant="outline">{item.category.name}</Badge></TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{item.bomCode ?? "-"}</TableCell>
                <TableCell>
                  <span className={item.quantity <= item.safetyStock && item.safetyStock > 0 ? "text-red-600 font-semibold" : ""}>
                    {item.quantity} {item.unit}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{item.position ?? "-"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm"
                      onClick={() => { setEditing(item); setDialogOpen(true); }}>编辑</Button>
                    <Button variant="ghost" size="sm"
                      onClick={() => handleDelete(item)}>删除</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden space-y-3">
        {data.items.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <Link href={`/items/${item.id}`} className="font-semibold hover:underline">{item.name}</Link>
                  <p className="text-sm text-muted-foreground">{item.code}{item.bomCode ? ` | ${item.bomCode}` : ""}</p>
                </div>
                <Badge variant={item.quantity <= item.safetyStock && item.safetyStock > 0 ? "destructive" : "secondary"}>
                  {item.quantity} {item.unit}
                </Badge>
              </div>
              <div className="flex gap-2 mt-2 text-sm text-muted-foreground">
                <span>{item.category.name}</span>
                {item.position && <span>| {item.position}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.items.length === 0 && (
        <p className="text-center text-muted-foreground py-12">暂无物料</p>
      )}

      {data.total > 30 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>上一页</Button>
          <span className="text-sm text-muted-foreground self-center">{page} / {Math.ceil(data.total / 30)}</span>
          <Button variant="outline" size="sm" disabled={page * 30 >= data.total} onClick={() => setPage((p) => p + 1)}>下一页</Button>
        </div>
      )}
        </>
      )}

      <ItemFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editing}
        categories={categoriesFlat}
        onSaved={loadItems}
      />
    </div>
  );
}
