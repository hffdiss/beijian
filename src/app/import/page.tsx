"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  const handleImport = async () => {
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
            将从当前目录下的 beijian.xlsx 文件中导入"新增BOM"和"发货项目清单"两个工作表的数据。
            导入使用 upsert 策略，重复数据将被跳过。
          </p>
          <Button onClick={handleImport} disabled={loading}>
            {loading ? "导入中..." : "开始导入"}
          </Button>
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
    </div>
  );
}
