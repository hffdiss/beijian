"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumb } from "@/components/breadcrumb";
import { useToast } from "@/components/toast";
import { DetailSkeleton } from "@/components/skeleton";

interface PartItem {
  id: string; partSn: string; description: string | null;
  spareStatus: string | null; spareWarehouse: string | null;
  bom: { bomCode: string; name: string | null } | null;
}

interface Machine {
  id: string; machineSn: string; manufacturerSn: string | null;
  product: string | null; modelCode: string | null; manufacturer: string | null;
  project: { id: string; name: string; city: string | null; contractNumber: string | null };
  parts: PartItem[];
  _count: { parts: number };
}

interface ProjectOption { id: string; name: string; }

export default function MachineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [form, setForm] = useState({
    machineSn: "", manufacturerSn: "", product: "", modelCode: "", manufacturer: "", projectId: "",
  });

  const load = () => {
    fetch(`/api/machines/${id}`).then((r) => r.json()).then((data) => {
      setMachine(data);
      setForm({
        machineSn: data.machineSn ?? "", manufacturerSn: data.manufacturerSn ?? "",
        product: data.product ?? "", modelCode: data.modelCode ?? "",
        manufacturer: data.manufacturer ?? "", projectId: data.project?.id ?? "",
      });
    });
  };

  useEffect(() => {
    load();
    fetch("/api/projects").then((r) => r.json()).then(setProjects);
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/machines/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const err = await res.json(); toast.error(err.error);; return; }
      setEditing(false);
      load();
    } catch { toast.error("保存失败"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm("确定删除该机器？此操作不可撤销。")) return;
    const res = await fetch(`/api/machines/${id}`, { method: "DELETE" });
    if (!res.ok) { const err = await res.json(); toast.error(err.error);; return; }
    router.push("/machines");
  };

  if (!machine) return <div className="p-6 max-w-6xl mx-auto"><DetailSkeleton /></div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Breadcrumb items={[
        { label: "机器管理", href: "/machines" },
        { label: machine.machineSn },
      ]} />
      <div className="flex items-center gap-3 mb-6">
        <Link href="/machines"><Button variant="ghost" size="sm">&larr; 返回</Button></Link>
        <h1 className="text-2xl font-bold font-mono">{machine.machineSn}</h1>
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

      {editing && (
        <Card className="mb-6 border-primary/50">
          <CardHeader><CardTitle className="text-base">编辑机器信息</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">整机SN</label><Input value={form.machineSn} onChange={(e) => setForm({ ...form, machineSn: e.target.value })} /></div>
              <div><label className="text-sm font-medium">厂商SN</label><Input value={form.manufacturerSn} onChange={(e) => setForm({ ...form, manufacturerSn: e.target.value })} /></div>
              <div><label className="text-sm font-medium">产品</label><Input value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} /></div>
              <div><label className="text-sm font-medium">型号代码</label><Input value={form.modelCode} onChange={(e) => setForm({ ...form, modelCode: e.target.value })} /></div>
              <div><label className="text-sm font-medium">厂商</label><Input value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} /></div>
              <div>
                <label className="text-sm font-medium">所属项目</label>
                <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v ?? "" })}>
                  <SelectTrigger><SelectValue placeholder="选择项目" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">无</SelectItem>
                    {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">部件数</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{machine._count.parts}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">产品</CardTitle></CardHeader>
          <CardContent><p className="font-semibold">{machine.product ?? "-"}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">厂商</CardTitle></CardHeader>
          <CardContent><p className="font-semibold">{machine.manufacturer ?? "-"}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">所属项目</CardTitle></CardHeader>
          <CardContent>
            <Link href={`/projects/${machine.project.id}`} className="font-semibold hover:underline text-sm">{machine.project.name}</Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-6">
        <div><span className="text-muted-foreground">厂商SN:</span> {machine.manufacturerSn ?? "-"}</div>
        <div><span className="text-muted-foreground">型号代码:</span> {machine.modelCode ?? "-"}</div>
        <div><span className="text-muted-foreground">项目城市:</span> {machine.project.city ?? "-"}</div>
        <div><span className="text-muted-foreground">合同号:</span> {machine.project.contractNumber ?? "-"}</div>
      </div>

      <Card>
        <CardHeader><CardTitle>关联部件 ({machine.parts.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>部件SN</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>BOM</TableHead>
                <TableHead>备件状态</TableHead>
                <TableHead>库房</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {machine.parts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-sm">
                    <Link href={`/parts/${p.id}`} className="hover:underline">{p.partSn}</Link>
                  </TableCell>
                  <TableCell className="max-w-[250px] truncate">{p.description ?? "-"}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{p.bom?.bomCode ?? "-"}</TableCell>
                  <TableCell><Badge variant="outline">{p.spareStatus ?? "-"}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{p.spareWarehouse ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
