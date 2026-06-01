"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface ImportResult {
  projects: number;
  machines: number;
  boms: number;
  parts: number;
  errors: string[];
  error?: string;
}

export default function ImportPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleImport = async () => {
    setConfirmOpen(false);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/import", { method: "POST" });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ projects: 0, machines: 0, boms: 0, parts: 0, errors: ["网络错误"], error: undefined });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">数据导入</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>从 beijian.xlsx 导入数据</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm mb-4">
            将从项目目录下的 <code className="bg-muted px-1 py-0.5 rounded text-xs">beijian.xlsx</code> 文件中导入两个工作表的数据：
          </p>
          <ul className="text-sm text-muted-foreground mb-4 space-y-1 ml-4 list-disc">
            <li><strong>新增BOM</strong> — BOM 主数据（编码、物料分类、型号等）</li>
            <li><strong>发货项目清单(含BBOM SN)</strong> — 项目、机器、部件 SN 级记录</li>
          </ul>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-amber-800">
              ⚠️ 导入将覆盖已有数据。已存在的项目、机器、BOM 和部件会被 Excel 中的最新数据更新。
              此操作不可撤销，请确认后再执行。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              我已确认，了解此操作将覆盖现有数据
            </label>
          </div>
          <div className="mt-4">
            <Button onClick={() => setConfirmOpen(true)} disabled={loading || !confirmed}>
              {loading ? "导入中..." : "开始导入"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && !result.error && (
        <Card>
          <CardHeader>
            <CardTitle>导入结果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold">{result.projects}</p>
                <p className="text-sm text-muted-foreground">项目</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold">{result.machines}</p>
                <p className="text-sm text-muted-foreground">机器</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold">{result.boms}</p>
                <p className="text-sm text-muted-foreground">BOM</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold">{result.parts}</p>
                <p className="text-sm text-muted-foreground">部件</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div>
                <p className="text-sm font-medium text-destructive mb-2">
                  导入错误 ({result.errors.length})
                </p>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {result.errors.slice(0, 20).map((err, i) => (
                    <p key={i} className="text-xs text-muted-foreground font-mono">
                      {err}
                    </p>
                  ))}
                  {result.errors.length > 20 && (
                    <p className="text-xs text-muted-foreground">
                      ... 还有 {result.errors.length - 20} 条错误
                    </p>
                  )}
                </div>
              </div>
            )}

            {result.errors.length === 0 && (
              <Badge variant="default">导入完成，无错误</Badge>
            )}
          </CardContent>
        </Card>
      )}

      {result?.error && (
        <Card>
          <CardContent className="p-4">
            <p className="text-destructive">{result.error}</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认导入</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p>即将从 <code className="bg-muted px-1 py-0.5 rounded text-xs">beijian.xlsx</code> 执行数据导入：</p>
            <ul className="space-y-1 ml-4 list-disc text-muted-foreground">
              <li>Sheet「新增BOM」→ BOM 主数据</li>
              <li>Sheet「发货项目清单」→ 项目 / 机器 / 部件</li>
            </ul>
            <p className="text-amber-600 font-medium">
              已存在的记录将被 Excel 中的最新数据覆盖更新。
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>取消</Button>
            <Button onClick={handleImport}>确认导入</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
