"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SelectOption { id: string; name: string; }
interface MachineOption { id: string; machineSn: string; product: string | null; }
interface BomOption { id: string; bomCode: string; name: string | null; }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function PartFormDialog({ open, onOpenChange, onSaved }: Props) {
  const [form, setForm] = useState({
    partSn: "", description: "", model: "", equipmentCategory: "",
    projectId: "", machineId: "", bomCode: "",
    spareStatus: "", spareWarehouse: "", spareQuantity: 0,
    isSpare: false,
  });
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<SelectOption[]>([]);
  const [machines, setMachines] = useState<MachineOption[]>([]);
  const [boms, setBoms] = useState<BomOption[]>([]);

  useEffect(() => {
    if (open) {
      fetch("/api/projects").then((r) => r.json()).then(setProjects);
      fetch("/api/machines?limit=300").then((r) => r.json()).then((d) => setMachines(Array.isArray(d) ? d : d.machines ?? []));
      fetch("/api/boms?limit=200").then((r) => r.json()).then((d) => setBoms(d.boms));
    }
  }, [open]);

  const handleSave = async () => {
    if (!form.partSn.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const err = await res.json(); alert(err.error || "保存失败"); return; }
      onOpenChange(false);
      onSaved();
      setForm({ partSn: "", description: "", model: "", equipmentCategory: "", projectId: "", machineId: "", bomCode: "", spareStatus: "", spareWarehouse: "", spareQuantity: 0, isSpare: false });
    } catch { alert("保存失败"); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>新增部件</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">部件SN *</label>
              <Input value={form.partSn} onChange={(e) => setForm({ ...form, partSn: e.target.value })} placeholder="必填" />
            </div>
            <div>
              <label className="text-sm font-medium">型号</label>
              <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">描述</label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">类别</label>
              <Input value={form.equipmentCategory} onChange={(e) => setForm({ ...form, equipmentCategory: e.target.value })} placeholder="如 NVME SSD" />
            </div>
            <div>
              <label className="text-sm font-medium">备件状态</label>
              <Select value={form.spareStatus || ""} onValueChange={(v) => setForm({ ...form, spareStatus: v })}>
                <SelectTrigger><SelectValue placeholder="选择" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">无</SelectItem>
                  <SelectItem value="OK">OK</SelectItem>
                  <SelectItem value="POK">POK</SelectItem>
                  <SelectItem value="NG">NG</SelectItem>
                  <SelectItem value="不涉及">不涉及</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium">项目</label>
              <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v })}>
                <SelectTrigger><SelectValue placeholder="选择" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">无</SelectItem>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">机器</label>
              <Select value={form.machineId} onValueChange={(v) => setForm({ ...form, machineId: v })}>
                <SelectTrigger><SelectValue placeholder="选择" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">无</SelectItem>
                  {machines.map((m) => <SelectItem key={m.id} value={m.id}>{m.machineSn}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">BOM</label>
              <Select value={form.bomCode} onValueChange={(v) => setForm({ ...form, bomCode: v })}>
                <SelectTrigger><SelectValue placeholder="选择" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">无</SelectItem>
                  {boms.map((b) => <SelectItem key={b.id} value={b.bomCode}>{b.bomCode}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSave} disabled={!form.partSn.trim() || saving}>{saving ? "保存中..." : "保存"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
