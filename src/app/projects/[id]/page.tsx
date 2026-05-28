"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Machine {
  id: string;
  machineSn: string;
  product: string | null;
  modelCode: string | null;
  manufacturer: string | null;
  _count: { parts: number };
}

interface Part {
  id: string;
  partSn: string;
  description: string | null;
  spareStatus: string | null;
  bom: { bomCode: string; name: string | null } | null;
}

interface Project {
  id: string;
  name: string;
  city: string | null;
  contractNumber: string | null;
  oem: string | null;
  warrantyEnd: string | null;
  projectSla: string | null;
  remark: string | null;
  _count: { machines: number; parts: number };
  machines: Machine[];
  parts: Part[];
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", city: "", contractNumber: "", oem: "", projectSla: "", remark: "" });

  const load = () => {
    fetch(`/api/projects/${id}`).then((r) => r.json()).then((data) => {
      setProject(data);
      setForm({ name: data.name ?? "", city: data.city ?? "", contractNumber: data.contractNumber ?? "", oem: data.oem ?? "", projectSla: data.projectSla ?? "", remark: data.remark ?? "" });
    });
  };
  useEffect(() => { load(); }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const err = await res.json(); alert(err.error); return; }
      setEditing(false);
      load();
    } catch { alert("保存失败"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm("确定删除该项目？此操作不可撤销。")) return;
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (!res.ok) { const err = await res.json(); alert(err.error); return; }
    router.push("/projects");
  };

  if (!project) return <div className="p-6">加载中...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/projects"><Button variant="ghost" size="sm">&larr; 返回</Button></Link>
        <h1 className="text-2xl font-bold">{project.name}</h1>
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
          <CardHeader><CardTitle className="text-base">编辑项目信息</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">项目名称</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="text-sm font-medium">城市</label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div><label className="text-sm font-medium">合同号</label><Input value={form.contractNumber} onChange={(e) => setForm({ ...form, contractNumber: e.target.value })} /></div>
              <div><label className="text-sm font-medium">OEM</label><Input value={form.oem} onChange={(e) => setForm({ ...form, oem: e.target.value })} /></div>
              <div><label className="text-sm font-medium">项目SLA</label><Input value={form.projectSla} onChange={(e) => setForm({ ...form, projectSla: e.target.value })} /></div>
              <div><label className="text-sm font-medium">备注</label><Input value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} /></div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">机器数</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{project._count.machines}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">部件数</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{project._count.parts}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">城市</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{project.city ?? "-"}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">维保截止</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xl font-bold">
              {project.warrantyEnd ? new Date(project.warrantyEnd).toLocaleDateString("zh-CN") : "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
        <div><span className="text-muted-foreground">合同号:</span> {project.contractNumber ?? "-"}</div>
        <div><span className="text-muted-foreground">OEM:</span> {project.oem ?? "-"}</div>
        <div><span className="text-muted-foreground">SLA:</span> {project.projectSla ?? "-"}</div>
        <div><span className="text-muted-foreground">备注:</span> {project.remark ?? "-"}</div>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>机器列表 ({project.machines.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>整机SN</TableHead>
                <TableHead>产品</TableHead>
                <TableHead>型号代码</TableHead>
                <TableHead>厂商</TableHead>
                <TableHead>部件数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {project.machines.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-sm">
                    <Link href={`/machines/${m.id}`} className="hover:underline">{m.machineSn}</Link>
                  </TableCell>
                  <TableCell>{m.product ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{m.modelCode ?? "-"}</TableCell>
                  <TableCell>{m.manufacturer ?? "-"}</TableCell>
                  <TableCell><Badge variant="outline">{m._count.parts}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>最近部件</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>部件SN</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>BBOM</TableHead>
                <TableHead>备件状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {project.parts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-sm">
                    <Link href={`/parts/${p.id}`} className="hover:underline">{p.partSn}</Link>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">{p.description ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{p.bom?.bomCode ?? "-"}</TableCell>
                  <TableCell><Badge variant="outline">{p.spareStatus ?? "-"}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
