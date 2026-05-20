"use client";

import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  description: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  categories: Category[];
  onSaved: () => void;
}

export function CategoryFormDialog({
  open, onOpenChange, category, categories, onSaved,
}: Props) {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setParentId(category.parentId);
      setDescription(category.description ?? "");
    } else {
      setName("");
      setParentId(null);
      setDescription("");
    }
  }, [category, open]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const method = category ? "PUT" : "POST";
      const url = category
        ? `/api/categories/${category.id}`
        : "/api/categories";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), parentId: parentId || null, description }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "保存失败");
        return;
      }
      onOpenChange(false);
      onSaved();
    } catch {
      alert("网络错误，保存失败");
    } finally {
      setSaving(false);
    }
  };

  const rootCategories = categories.filter((c) => !c.parentId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "编辑分类" : "新增分类"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">名称</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">上级分类</label>
            <Select
              value={parentId ?? "null"}
              onValueChange={(v) => setParentId(v === "null" ? null : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="无（顶级分类）" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">无（顶级分类）</SelectItem>
                {rootCategories
                  .filter((c) => c.id !== category?.id)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">描述</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={!name || saving}>
            {saving ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
