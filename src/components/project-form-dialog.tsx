"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/toast";

interface ProjectItem {
  id?: string;
  name: string;
  city?: string | null;
  contractNumber?: string | null;
  oem?: string | null;
  projectSla?: string | null;
  remark?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: ProjectItem | null;
  onSaved: () => void;
}

export function ProjectFormDialog({ open, onOpenChange, project, onSaved }: Props) {
  const [form, setForm] = useState({ name: "", city: "", contractNumber: "", oem: "", projectSla: "", remark: "" });
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name ?? "",
        city: project.city ?? "",
        contractNumber: project.contractNumber ?? "",
        oem: project.oem ?? "",
        projectSla: project.projectSla ?? "",
        remark: project.remark ?? "",
      });
    } else {
      setForm({ name: "", city: "", contractNumber: "", oem: "", projectSla: "", remark: "" });
    }
  }, [project, open]);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const method = project?.id ? "PUT" : "POST";
      const url = project?.id ? `/api/projects/${project.id}` : "/api/projects";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const err = await res.json(); toast.error(err.error); return; }
      onOpenChange(false);
      onSaved();
      toast.success("保存成功");
    } catch { toast.error("保存失败"); }
    finally { setSaving(false); }
  };

  const field = (label: string, key: keyof typeof form) => (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <Input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{project?.id ? "编辑项目" : "新增项目"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {field("项目名称", "name")}
          <div className="grid grid-cols-2 gap-3">
            {field("城市", "city")}
            {field("合同号", "contractNumber")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("OEM", "oem")}
            {field("项目SLA", "projectSla")}
          </div>
          {field("备注", "remark")}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSave} disabled={!form.name.trim() || saving}>{saving ? "保存中..." : "保存"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
