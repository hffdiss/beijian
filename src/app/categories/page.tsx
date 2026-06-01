"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { CategoryFormDialog } from "@/components/category-form-dialog";

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  description: string | null;
  _count: { items: number };
  children?: Category[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data);
    } catch {
      // silently handle — will show empty state
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除？")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error);
      return;
    }
    load();
  };

  const topCategories = categories.filter((c) => !c.parentId);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">分类管理</h1>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          新增分类
        </Button>
      </div>

      {topCategories.map((cat) => {
        const children = categories.filter((c) => c.parentId === cat.id);
        return (
          <Card key={cat.id} className="mb-4">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{cat.name}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="secondary">{cat._count.items} 物料</Badge>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => { setEditing(cat); setDialogOpen(true); }}
                  >
                    编辑
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => handleDelete(cat.id)}
                  >
                    删除
                  </Button>
                </div>
              </div>
              {cat.description && (
                <p className="text-sm text-muted-foreground">{cat.description}</p>
              )}
            </CardHeader>
            {children.length > 0 && (
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>名称</TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead>物料数</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {children.map((child) => (
                      <TableRow key={child.id}>
                        <TableCell>{child.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {child.description ?? "-"}
                        </TableCell>
                        <TableCell>{child._count.items}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => { setEditing(child); setDialogOpen(true); }}
                            >
                              编辑
                            </Button>
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => handleDelete(child.id)}
                            >
                              删除
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            )}
          </Card>
        );
      })}

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editing}
        categories={categories}
        onSaved={load}
      />
    </div>
  );
}
