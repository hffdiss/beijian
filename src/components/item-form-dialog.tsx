"use client";

import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/toast";

interface Item {
  id?: string;
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
}

interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Partial<Item> | null;
  categories: Category[];
  onSaved: () => void;
}

export function ItemFormDialog({
  open, onOpenChange, item, categories, onSaved,
}: Props) {
  const emptyForm = {
    code: "", name: "", categoryId: "", unit: "个",
    description: null, sn: null, model: null, manufacturer: null,
    quantity: 0, safetyStock: 0,
    position: null, supplier: null, price: null,
    warrantyStart: null, warrantyEnd: null,
    nandType: null, compatibleProducts: null,
  } as Item;

  const [form, setForm] = useState<Item>(emptyForm);
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [bomList, setBomList] = useState<{ id: string; bomCode: string; name: string | null }[]>([]);

  useEffect(() => {
    if (open) {
      fetch("/api/boms?limit=200").then((r) => r.json()).then((d) => setBomList(d.boms ?? []));
    }
  }, [open]);

  useEffect(() => {
    if (item) {
      setForm({
        ...emptyForm,
        ...item,
        warrantyStart: (item.warrantyStart as string)?.split("T")[0] ?? null,
        warrantyEnd: (item.warrantyEnd as string)?.split("T")[0] ?? null,
      });
    } else {
      setForm(emptyForm);
    }
  }, [item, open]);

  const update = (key: keyof Item, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const method = item?.id ? "PUT" : "POST";
      const url = item?.id ? `/api/items/${item.id}` : "/api/items";
      const body = {
        ...form,
        warrantyStart: form.warrantyStart || null,
        warrantyEnd: form.warrantyEnd || null,
        nandType: form.nandType || null,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "保存失败"); return; }
      onOpenChange(false);
      onSaved();
      toast.success("保存成功");
    } catch { toast.error("网络错误");
    } finally {
      setSaving(false);
    }
  };

  const nandOptions = ["SLC", "MLC", "TLC", "QLC"];
  const unitOptions = ["个", "米", "千克", "卷", "包", "箱", "台", "张", "支", "根"];

  const field = (label: string, key: keyof Item, opts?: { type?: string }) => (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <Input
        type={opts?.type ?? "text"}
        value={(form[key] as string) ?? ""}
        onChange={(e) => update(key, opts?.type === "number" ? Number(e.target.value) : e.target.value)}
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item?.id ? "编辑物料" : "新增物料"}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="basic">
          <TabsList className="w-full">
            <TabsTrigger value="basic" className="flex-1">基本信息</TabsTrigger>
            <TabsTrigger value="server" className="flex-1">服务器部件</TabsTrigger>
            <TabsTrigger value="other" className="flex-1">其他</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {field("编号", "code")}
              {field("名称", "name")}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">分类</label>
                <Select
                  value={form.categoryId || "null"}
                  onValueChange={(v) => update("categoryId", !v || v === "null" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">选择分类</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.parentId ? "  └ " : ""}{c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">单位</label>
                <Select
                  value={form.unit}
                  onValueChange={(v) => v && update("unit", v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {unitOptions.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {field("初始库存", "quantity", { type: "number" })}
              {field("安全库存", "safetyStock", { type: "number" })}
            </div>
            {field("型号", "model")}
            <div className="grid grid-cols-2 gap-3">
              {field("存放位置", "position")}
              {field("参考单价", "price", { type: "number" })}
            </div>
            {field("供应商", "supplier")}
            {field("描述", "description")}
          </TabsContent>

          <TabsContent value="server" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {field("SN 号", "sn")}
              {field("厂商", "manufacturer")}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">维保起始</label>
                <Input
                  type="date"
                  value={form.warrantyStart as string ?? ""}
                  onChange={(e) => update("warrantyStart", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">维保截止</label>
                <Input
                  type="date"
                  value={form.warrantyEnd as string ?? ""}
                  onChange={(e) => update("warrantyEnd", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">SSD 颗粒类型</label>
              <Select
                value={form.nandType || "null"}
                onValueChange={(v) => update("nandType", !v || v === "null" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="不适用" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">不适用</SelectItem>
                  {nandOptions.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {field("适用产品", "compatibleProducts")}
          </TabsContent>

          <TabsContent value="other" className="space-y-3">
            <div>
              <label className="text-sm font-medium">关联BOM</label>
              <Select
                value={form.bomCode ?? "null"}
                onValueChange={(v) => update("bomCode", !v || v === "null" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择关联BOM（可选）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">不关联</SelectItem>
                  {bomList.map((b) => (
                    <SelectItem key={b.id} value={b.bomCode}>
                      {b.bomCode}{b.name ? ` — ${b.name}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">备注</label>
              <Textarea
                value={form.description ?? ""}
                onChange={(e) => update("description", e.target.value)}
                rows={4}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={!form.code || !form.name || !form.categoryId || saving}
          >
            {saving ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
