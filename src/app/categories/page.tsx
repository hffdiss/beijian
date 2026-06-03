"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { CategoryFormDialog } from "@/components/category-form-dialog";
import { Breadcrumb } from "@/components/breadcrumb";
import { useToast } from "@/components/toast";

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  description: string | null;
  _count: { items: number };
  children?: Category[];
}

export default function CategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      setCategories(await res.json());
    } catch { toast.error("加载分类失败"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (cat: Category) => {
    if (!confirm(`确定删除"${cat.name}"？`)) return;
    const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
    if (!res.ok) { const err = await res.json(); toast.error(err.error); return; }
    toast.success(`已删除"${cat.name}"`);
    load();
  };

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Build tree: parent → children hierarchy
  const roots = categories.filter((c) => !c.parentId);
  const childrenOf = (parentId: string) => categories.filter((c) => c.parentId === parentId);

  // Tree row renderer
  const renderRow = (cat: Category, depth: number) => {
    const kids = childrenOf(cat.id);
    const hasKids = kids.length > 0;
    const isCollapsed = collapsed.has(cat.id);
    const totalItems = cat._count.items;

    // Flatten rows
    const rows = [];
    rows.push(
      <TableRow key={cat.id} className={depth > 0 ? "bg-muted/20" : ""}>
        <TableCell className="flex items-center gap-2" style={{ paddingLeft: `${12 + depth * 24}px` }}>
          {hasKids ? (
            <button onClick={() => toggleCollapse(cat.id)} className="text-xs w-5 h-5 flex items-center justify-center hover:bg-muted rounded">
              {isCollapsed ? "▶" : "▼"}
            </button>
          ) : (
            <span className="w-5 inline-block" />
          )}
          <span className="font-medium">{cat.name}</span>
        </TableCell>
        <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{cat.description ?? "-"}</TableCell>
        <TableCell>
          <Badge variant="secondary">{totalItems} 物料</Badge>
          {hasKids && <Badge variant="outline" className="ml-1">{kids.length} 子分类</Badge>}
        </TableCell>
        <TableCell>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => { setEditing(cat); setDialogOpen(true); }}>编辑</Button>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(cat)}>删除</Button>
          </div>
        </TableCell>
      </TableRow>
    );

    // Render children if not collapsed
    if (hasKids && !isCollapsed) {
      kids.forEach((child) => {
        rows.push(...renderRow(child, depth + 1));
      });
    }
    return rows;
  };

  // Search filter — keep matching categories + their ancestors visible
  const lower = search.toLowerCase();
  let visibleRoots = roots;
  if (search) {
    const matchingIds = new Set(
      categories.filter((c) => c.name.toLowerCase().includes(lower)).map((c) => c.id)
    );
    // Also include parents of matches
    categories.forEach((c) => {
      if (matchingIds.has(c.id) && c.parentId) {
        let current = categories.find((x) => x.id === c.parentId);
        while (current) {
          matchingIds.add(current.id);
          current = current.parentId ? categories.find((x) => x.id === current!.parentId) : undefined;
        }
      }
    });
    visibleRoots = roots.filter((r) => matchingIds.has(r.id) || childrenOf(r.id).some((k) => matchingIds.has(k.id)));
    // Ensure all matching categories' ancestors are visible
    setCollapsed(new Set()); // Expand all when searching
  }

  const allRows = visibleRoots.flatMap((r) => renderRow(r, 0));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Breadcrumb items={[{ label: "分类管理" }]} />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">分类管理</h1>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>新增分类</Button>
      </div>

      <div className="flex gap-3 mb-4">
        <Input placeholder="搜索分类名称..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <Button variant="outline" size="sm" onClick={() => setCollapsed(new Set(roots.map((r) => r.id)))}>全部折叠</Button>
        <Button variant="outline" size="sm" onClick={() => setCollapsed(new Set())}>全部展开</Button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (<div key={i} className="h-12 bg-muted rounded" />))}
        </div>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p className="text-4xl mb-3">🗂️</p>
            <p className="font-medium">暂无分类</p>
            <p className="text-sm mt-1">点击"新增分类"创建第一个分类</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>关联</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allRows.length > 0 ? allRows : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">无匹配分类</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editing}
        categories={categories}
        onSaved={() => { load(); toast.success("保存成功"); }}
      />
    </div>
  );
}
