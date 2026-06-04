"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/toast";

interface MachineItem {
  id?: string;
  machineSn: string;
  manufacturerSn?: string | null;
  product?: string | null;
  modelCode?: string | null;
  manufacturer?: string | null;
  projectId?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machine?: MachineItem | null;
  onSaved: () => void;
}

export function MachineFormDialog({ open, onOpenChange, machine, onSaved }: Props) {
  const toast = useToast();
  const [form, setForm] = useState({ machineSn: "", manufacturerSn: "", product: "", modelCode: "", manufacturer: "", projectId: "" });
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetch("/api/projects").then((r) => r.json()).then(setProjects);
      if (machine) {
        setForm({
          machineSn: machine.machineSn ?? "",
          manufacturerSn: machine.manufacturerSn ?? "",
          product: machine.product ?? "",
          modelCode: machine.modelCode ?? "",
          manufacturer: machine.manufacturer ?? "",
          projectId: machine.projectId ?? "",
        });
      } else {
        setForm({ machineSn: "", manufacturerSn: "", product: "", modelCode: "", manufacturer: "", projectId: "" });
      }
    }
  }, [machine, open]);

  const handleSave = async () => {
    if (!form.machineSn.trim()) { toast.error("整机SN不能为空"); return; }
    setSaving(true);
    try {
      const method = machine?.id ? "PUT" : "POST";
      const url = machine?.id ? `/api/machines/${machine.id}` : "/api/machines";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machineSn: form.machineSn.trim(),
          manufacturerSn: form.manufacturerSn.trim() || null,
          product: form.product.trim() || null,
          modelCode: form.modelCode.trim() || null,
          manufacturer: form.manufacturer.trim() || null,
          projectId: form.projectId || null,
        }),
      });
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "保存失败"); return; }
      onOpenChange(false);
      onSaved();
      toast.success("保存成功");
    } catch { toast.error("网络错误"); }
    finally { setSaving(false); }
  };

  const field = (label: string, key: keyof typeof form, opts?: { type?: string }) => (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <Input type={opts?.type ?? "text"} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{machine?.id ? "编辑机器" : "新增机器"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {field("整机SN", "machineSn")}
          <div className="grid grid-cols-2 gap-3">
            {field("厂商SN", "manufacturerSn")}
            {field("产品", "product")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("型号代码", "modelCode")}
            {field("厂商", "manufacturer")}
          </div>
          <div>
            <label className="text-sm font-medium">所属项目</label>
            <Select value={form.projectId || ""} onValueChange={(v) => setForm({ ...form, projectId: v })}>
              <SelectTrigger><SelectValue placeholder="选择项目" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">无</SelectItem>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSave} disabled={!form.machineSn.trim() || saving}>
            {saving ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
