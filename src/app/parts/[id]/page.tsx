"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumb } from "@/components/breadcrumb";

interface PartDetail {
  id: string; partSn: string;
  project: { id: string; name: string; city: string | null; contractNumber: string | null } | null;
  machine: { id: string; machineSn: string; product: string | null } | null;
  bom: { id: string; bomCode: string; name: string | null } | null;
  description: string | null; model: string | null; subModel: string | null;
  nandType: string | null; firmwareVersion: string | null;
  equipmentCategory: string | null;
  purchaseDate: string | null;
  projectWarrantyMonths: number | null; supplierWarrantyMonths: number | null;
  postStartupWarrantyMonths: number | null;
  projectSla: string | null; supplierSla: string | null;
  supplier: string | null; failureRate: number | null;
  isSpare: boolean; spareResponsible: string | null;
  spareQuantity: number; spareWarehouse: string | null;
  spareStrategy: string | null; spareStatus: string | null;
  monthGap: boolean | null; gapMonths: number | null; slaGap: boolean | null;
  remark: string | null;
}

interface SelectOption { id: string; name: string; }
interface MachineOption { id: string; machineSn: string; product: string | null; }
interface BomOption { id: string; bomCode: string; name: string | null; }

export default function PartDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [part, setPart] = useState<PartDetail | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [projects, setProjects] = useState<SelectOption[]>([]);
  const [machines, setMachines] = useState<MachineOption[]>([]);
  const [boms, setBoms] = useState<BomOption[]>([]);

  useEffect(() => {
    fetch(`/api/parts/${id}`).then((r) => r.json()).then((data) => {
      setPart(data);
      setForm({
        projectId: data.project?.id ?? "",
        machineId: data.machine?.id ?? "",
        bomCode: data.bom?.bomCode ?? "",
        spareStatus: data.spareStatus ?? "",
        spareWarehouse: data.spareWarehouse ?? "",
        spareQuantity: data.spareQuantity,
        spareStrategy: data.spareStrategy ?? "",
        spareResponsible: data.spareResponsible ?? "",
        remark: data.remark ?? "",
      });
    });
    // Load reference data for selectors
    fetch("/api/projects").then((r) => r.json()).then(setProjects);
    fetch("/api/machines?limit=300").then((r) => r.json()).then((d) => setMachines(Array.isArray(d) ? d : d.machines ?? []));
    fetch("/api/boms?limit=200").then((r) => r.json()).then((d) => setBoms(d.boms ?? []));
  }, [id]);

  const updateForm = (key: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/parts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const err = await res.json(); alert(err.error); return; }
      const updated = await res.json();
      setPart((prev) => prev ? { ...prev, ...updated, project: updated.project ?? prev.project, machine: updated.machine ?? prev.machine, bom: updated.bom ?? prev.bom } : prev);
      setEditing(false);
    } catch { alert("保存失败"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm("确定删除该部件？此操作不可撤销。")) return;
    try {
      const res = await fetch(`/api/parts/${id}`, { method: "DELETE" });
      if (!res.ok) { const err = await res.json(); alert(err.error); return; }
      router.push("/parts");
    } catch { alert("删除失败"); }
  };

  if (!part) return <div className="p-6">加载中...</div>;

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("zh-CN") : "-";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Breadcrumb items={[
        { label: "部件管理", href: "/parts" },
        { label: part?.partSn ?? "加载中..." },
      ]} />
      <div className="flex items-center gap-3 mb-6">
        <Link href="/parts"><Button variant="ghost" size="sm">&larr; 返回</Button></Link>
        <h1 className="text-2xl font-bold font-mono">{part.partSn}</h1>
        {part.isSpare && <Badge>备件</Badge>}
        {part.spareStatus && <Badge variant={part.spareStatus === "NG" ? "destructive" : "secondary"}>{part.spareStatus}</Badge>}
        <div className="flex-1" />
        {!editing ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(true)}>编辑</Button>
            <Button variant="destructive" onClick={handleDelete}>删除</Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(false)}>取消</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "保存中..." : "保存"}</Button>
          </div>
        )}
      </div>

      {/* 关联编辑区 */}
      {editing && (
        <Card className="mb-6 border-primary/50">
          <CardHeader><CardTitle className="text-base">编辑关联与备件信息</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium">所属项目</label>
                <Select value={String(form.projectId ?? "")} onValueChange={(v) => updateForm("projectId", v)}>
                  <SelectTrigger><SelectValue placeholder="选择项目" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">无</SelectItem>
                    {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">所属机器</label>
                <Select value={String(form.machineId ?? "")} onValueChange={(v) => updateForm("machineId", v)}>
                  <SelectTrigger><SelectValue placeholder="选择机器" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">无</SelectItem>
                    {machines.map((m) => <SelectItem key={m.id} value={m.id}>{m.machineSn}{m.product ? ` (${m.product})` : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">BBOM编码</label>
                <Select value={String(form.bomCode ?? "")} onValueChange={(v) => updateForm("bomCode", v)}>
                  <SelectTrigger><SelectValue placeholder="选择BOM" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">无</SelectItem>
                    {boms.map((b) => <SelectItem key={b.id} value={b.bomCode}>{b.bomCode}{b.name ? ` - ${b.name}` : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-sm font-medium">备件状态</label>
                <Select value={String(form.spareStatus ?? "")} onValueChange={(v) => updateForm("spareStatus", v)}>
                  <SelectTrigger><SelectValue placeholder="状态" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部</SelectItem>
                    <SelectItem value="OK">OK</SelectItem>
                    <SelectItem value="POK">POK</SelectItem>
                    <SelectItem value="NG">NG</SelectItem>
                    <SelectItem value="不涉及">不涉及</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">备件库房</label>
                <Select value={String(form.spareWarehouse ?? "")} onValueChange={(v) => updateForm("spareWarehouse", v)}>
                  <SelectTrigger><SelectValue placeholder="库房" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">无</SelectItem>
                    <SelectItem value="成都">成都</SelectItem>
                    <SelectItem value="现场备件">现场备件</SelectItem>
                    <SelectItem value="不涉及">不涉及</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">备件数量</label>
                <Input type="number" value={Number(form.spareQuantity ?? 0)} onChange={(e) => updateForm("spareQuantity", parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <label className="text-sm font-medium">备件责任主体</label>
                <Input value={String(form.spareResponsible ?? "")} onChange={(e) => updateForm("spareResponsible", e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">备件策略</label>
                <Input value={String(form.spareStrategy ?? "")} onChange={(e) => updateForm("spareStrategy", e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">备注</label>
                <Input value={String(form.remark ?? "")} onChange={(e) => updateForm("remark", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 关联信息卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">项目</CardTitle></CardHeader>
          <CardContent>
            {part.project ? (
              <Link href={`/projects/${part.project.id}`} className="font-semibold hover:underline text-sm">{part.project.name}</Link>
            ) : "-"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">机器</CardTitle></CardHeader>
          <CardContent>
            {part.machine ? (
              <Link href={`/machines/${part.machine.id}`} className="font-mono font-semibold hover:underline text-sm">{part.machine.machineSn}</Link>
            ) : "-"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">BOM</CardTitle></CardHeader>
          <CardContent>
            {part.bom ? (
              <Link href={`/boms/${part.bom.id}`} className="font-mono hover:underline text-sm">{part.bom.bomCode}</Link>
            ) : "-"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">备件库房</CardTitle></CardHeader>
          <CardContent><p className="font-semibold">{part.spareWarehouse ?? "-"}</p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle>规格信息</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">描述:</span> {part.description ?? "-"}</div>
              <div><span className="text-muted-foreground">型号:</span> {part.model ?? "-"}</div>
              <div><span className="text-muted-foreground">子型号:</span> {part.subModel ?? "-"}</div>
              <div><span className="text-muted-foreground">类别:</span> {part.equipmentCategory ?? "-"}</div>
              <div><span className="text-muted-foreground">NAND颗粒:</span> {part.nandType ?? "-"}</div>
              <div><span className="text-muted-foreground">固件版本:</span> {part.firmwareVersion ?? "-"}</div>
              <div><span className="text-muted-foreground">供应商:</span> {part.supplier ?? "-"}</div>
              <div><span className="text-muted-foreground">年故障率:</span> {part.failureRate != null ? `${part.failureRate}%` : "-"}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>维保与SLA</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">购买日期:</span> {formatDate(part.purchaseDate)}</div>
              <div><span className="text-muted-foreground">项目质保月:</span> {part.projectWarrantyMonths ?? "-"}</div>
              <div><span className="text-muted-foreground">供应商质保月:</span> {part.supplierWarrantyMonths ?? "-"}</div>
              <div><span className="text-muted-foreground">启动后质保月:</span> {part.postStartupWarrantyMonths ?? "-"}</div>
              <div><span className="text-muted-foreground">项目SLA:</span> {part.projectSla ?? "-"}</div>
              <div><span className="text-muted-foreground">供应商SLA:</span> {part.supplierSla ?? "-"}</div>
              <div><span className="text-muted-foreground">月份GAP:</span> {part.monthGap === true ? "是" : part.monthGap === false ? "否" : "-"}</div>
              <div><span className="text-muted-foreground">GAP(月):</span> {part.gapMonths ?? "-"}</div>
              <div><span className="text-muted-foreground">SLA GAP:</span> {part.slaGap === true ? "是" : part.slaGap === false ? "否" : "-"}</div>
              <div><span className="text-muted-foreground">备件责任主体:</span> {part.spareResponsible ?? "-"}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>备件信息</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">备件策略:</span> {part.spareStrategy ?? "-"}</div>
              <div><span className="text-muted-foreground">备注:</span> {part.remark ?? "-"}</div>
            </div>
          </CardContent>
        </Card>

        {part.bom && (
          <Card>
            <CardHeader><CardTitle>关联BOM详情</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">BBOM编码:</span> <span className="font-mono">{part.bom.bomCode}</span></div>
                <div><span className="text-muted-foreground">名称:</span> {part.bom.name ?? "-"}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
