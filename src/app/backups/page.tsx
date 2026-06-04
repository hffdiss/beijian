"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Breadcrumb } from "@/components/breadcrumb";
import { useToast } from "@/components/toast";

interface BackupItem {
  name: string;
  size: number;
  createdAt: string;
}

export default function BackupsPage() {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [uploadRestoring, setUploadRestoring] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/backup?action=list");
      setBackups(await res.json());
    } catch { setBackups([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    const res = await fetch("/api/backup", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      toast.success(`备份已创建 (${(data.size / 1024).toFixed(0)} KB)`);
      load();
    } else { toast.error("备份失败"); }
    setCreating(false);
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`确定删除备份 "${name}"？`)) return;
    const res = await fetch(`/api/backup?name=${encodeURIComponent(name)}`, { method: "DELETE" });
    if (res.ok) { toast.success("已删除"); load(); }
    else { toast.error("删除失败"); }
  };

  const handleDownload = (name: string) => {
    window.open(`/api/backup?action=download&name=${encodeURIComponent(name)}`, "_blank");
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setRestoring(true);
    const res = await fetch(`/api/backup?name=${encodeURIComponent(restoreTarget)}`, { method: "PUT" });
    if (res.ok) {
      toast.success("数据库已恢复，请刷新页面");
      setRestoreTarget(null);
      setTimeout(() => window.location.reload(), 1500);
    } else {
      const err = await res.json();
      toast.error(err.error ?? "恢复失败");
    }
    setRestoring(false);
  };

  const handleUploadRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".db")) { toast.error("请选择 .db 备份文件"); return; }
    if (!confirm(`确定用 "${file.name}" 恢复数据库？当前数据将被替换。`)) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setUploadRestoring(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/backup", { method: "PUT", body: formData });
    if (res.ok) {
      toast.success("数据库已恢复，即将刷新");
      setTimeout(() => window.location.reload(), 1500);
    } else {
      const err = await res.json();
      toast.error(err.error ?? "恢复失败");
    }
    setUploadRestoring(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const totalSize = backups.reduce((s, b) => s + b.size, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Breadcrumb items={[{ label: "备份管理" }]} />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">备份管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {backups.length} 个备份 · {(totalSize / 1024).toFixed(0)} KB
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreate} disabled={creating} variant="outline">
            {creating ? "创建中..." : "🔄 创建备份"}
          </Button>
          <a href="/api/backup" download>
            <Button variant="outline">📥 下载最新</Button>
          </a>
        </div>
      </div>

      {/* Upload restore */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">📤 从文件恢复</p>
              <p className="text-xs text-muted-foreground">上传 .db 备份文件恢复数据库</p>
            </div>
            <label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".db"
                onChange={handleUploadRestore}
                className="hidden"
              />
              <Button variant="outline" size="sm" disabled={uploadRestoring} onClick={() => fileInputRef.current?.click()}>
                {uploadRestoring ? "恢复中..." : "选择文件"}
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-12 bg-muted rounded" />))}
        </div>
      ) : backups.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p className="text-4xl mb-3">💾</p>
            <p className="font-medium">暂无备份</p>
            <p className="text-sm mt-1">点击"创建备份"或上传备份文件恢复</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">备份历史</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>文件名</TableHead>
                  <TableHead>大小</TableHead>
                  <TableHead>时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((b) => (
                  <TableRow key={b.name}>
                    <TableCell className="font-mono text-sm">
                      {b.name.startsWith("pre-import-") || b.name.startsWith("pre-restore-") ? (
                        <span className="flex items-center gap-1">
                          {b.name}
                          <Badge variant="outline" className="text-xs">自动</Badge>
                        </span>
                      ) : b.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{(b.size / 1024).toFixed(0)} KB</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(b.createdAt).toLocaleString("zh-CN")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(b.name)}>下载</Button>
                        <Button variant="ghost" size="sm" onClick={() => setRestoreTarget(b.name)}>恢复</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(b.name)}>删除</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Restore confirm dialog */}
      <Dialog open={!!restoreTarget} onOpenChange={() => setRestoreTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>确认恢复</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <p>即将从备份 <code className="bg-muted px-1 py-0.5 rounded text-xs">{restoreTarget}</code> 恢复数据库。</p>
            <div className="bg-destructive/10 text-destructive rounded-lg p-3">
              ⚠ 当前数据库将被替换！系统会自动备份当前数据为 <code className="bg-muted px-1 rounded text-xs">pre-restore-*.db</code>。
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreTarget(null)}>取消</Button>
            <Button variant="destructive" onClick={handleRestore} disabled={restoring}>
              {restoring ? "恢复中..." : "确认恢复"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
