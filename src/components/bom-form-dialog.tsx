"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/toast";

interface BomItem {
  id?: string;
  bomCode: string;
  name?: string | null;
  model?: string | null;
  subModel?: string | null;
  manufacturer?: string | null;
  manufacturerModel?: string | null;
  materialCategory?: string | null;
  materialSubcategory?: string | null;
  category?: string | null;
  unit?: string | null;
  quantity?: number;
  nandType?: string | null;
  firmwareVersion?: string | null;
  lifecycle?: string | null;
  supplier?: string | null;
  detailDescription?: string | null;
  processCode?: string | null;
  status?: string | null;
  isSpare?: boolean;
  remark?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bom?: BomItem | null;
  onSaved: () => void;
}

export function BomFormDialog({ open, onOpenChange, bom, onSaved }: Props) {
  const [form, setForm] = useState({
    bomCode: "", sbomCode: "", name: "", model: "", subModel: "",
    manufacturer: "", manufacturerModel: "", materialCategory: "",
    materialSubcategory: "", category: "", unit: "PCS", quantity: 1,
    nandType: "", firmwareVersion: "", lifecycle: "", supplier: "",
    detailDescription: "", processCode: "", status: "", isSpare: false, remark: "",
  });
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (bom) {
      setForm({
        bomCode: bom.bomCode ?? "",
        sbomCode: (bom as Record<string, unknown>).sbomCode as string ?? "",
        name: bom.name ?? "",
        model: bom.model ?? "",
        subModel: bom.subModel ?? "",
        manufacturer: bom.manufacturer ?? "",
        manufacturerModel: bom.manufacturerModel ?? "",
        materialCategory: bom.materialCategory ?? "",
        materialSubcategory: bom.materialSubcategory ?? "",
        category: bom.category ?? "",
        unit: bom.unit ?? "PCS",
        quantity: bom.quantity ?? 1,
        nandType: bom.nandType ?? "",
        firmwareVersion: bom.firmwareVersion ?? "",
        lifecycle: bom.lifecycle ?? "",
        supplier: bom.supplier ?? "",
        detailDescription: bom.detailDescription ?? "",
        processCode: bom.processCode ?? "",
        status: bom.status ?? "",
        isSpare: bom.isSpare ?? false,
        remark: bom.remark ?? "",
      });
    } else {
      setForm({
        bomCode: "", name: "", model: "", subModel: "", manufacturer: "",
        manufacturerModel: "", materialCategory: "", materialSubcategory: "",
        category: "", unit: "PCS", quantity: 1, nandType: "", firmwareVersion: "",
        lifecycle: "", supplier: "", detailDescription: "", processCode: "",
        status: "", isSpare: false, remark: "",
      });
    }
  }, [bom, open]);

  const update = (key: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!form.bomCode) return;
    setSaving(true);
    try {
      const method = bom?.id ? "PUT" : "POST";
      const url = bom?.id ? `/api/boms/${bom.id}` : "/api/boms";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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

  const field = (label: string, key: string, opts?: { type?: string; span?: boolean }) => (
    <div className={opts?.span ? "col-span-2" : ""}>
      <label className="text-sm font-medium">{label}</label>
      <Input
        type={opts?.type ?? "text"}
        value={String((form as Record<string, unknown>)[key] ?? "")}
        onChange={(e) => update(key, opts?.type === "number" ? Number(e.target.value) : e.target.value)}
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{bom?.id ? "编辑BOM" : "新增BOM"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {field("BBOM编码", "bomCode")}
            {field("SBOM编码", "sbomCode")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("名称", "name")}
            {field("型号", "model")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("子型号", "subModel")}
            {field("单位", "unit")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("物料大类", "materialCategory")}
            {field("物料小类", "materialSubcategory")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("厂商", "manufacturer")}
            {field("厂商型号", "manufacturerModel")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("供应商", "supplier")}
            {field("生命周期", "lifecycle")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("类别", "category")}
            {field("状态", "status")}
          </div>
          {field("详细描述", "detailDescription")}
          {field("备注", "remark")}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSave} disabled={!form.bomCode || saving}>
            {saving ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
