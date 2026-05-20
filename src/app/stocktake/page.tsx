"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface StockTakeRecord {
  id: string;
  itemId: string;
  expectedQuantity: number;
  actualQuantity: number;
  difference: number;
  note: string | null;
  batchId: string;
  item: { id: string; code: string; name: string; unit: string; position: string | null };
}

interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

interface BatchItem {
  batchId: string;
  _count: { id: number };
  _min: { createdAt: string };
}

function HistoryDetail({ batchId, onBack }: { batchId: string; onBack: () => void }) {
  const [records, setRecords] = useState<StockTakeRecord[]>([]);

  useEffect(() => {
    fetch(`/api/stocktake?batchId=${batchId}`)
      .then((r) => r.json())
      .then(setRecords);
  }, [batchId]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>&larr; 返回</Button>
        <h1 className="text-2xl font-bold">盘点详情</h1>
      </div>
      <div className="space-y-3">
        {records.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{r.item.name}</p>
                  <p className="text-sm text-muted-foreground">{r.item.code}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span>账面: {r.expectedQuantity}</span>
                  <span>实际: {r.actualQuantity}</span>
                  <Badge variant={r.difference !== 0 ? "destructive" : "outline"}>
                    {r.difference !== 0 ? (r.difference > 0 ? `+${r.difference}` : r.difference) : "一致"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function StockTakePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [records, setRecords] = useState<StockTakeRecord[]>([]);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [history, setHistory] = useState<BatchItem[]>([]);
  const [viewBatch, setViewBatch] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const res = await fetch("/api/stocktake");
    setHistory(await res.json());
  };

  const startStockTake = async () => {
    const res = await fetch("/api/stocktake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: categoryId || null }),
    });
    const data = await res.json();
    setBatchId(data.batchId);
    setCompleted(false);
    loadRecords(data.batchId);
  };

  const loadRecords = async (bid: string) => {
    const res = await fetch(`/api/stocktake?batchId=${bid}`);
    setRecords(await res.json());
  };

  const updateRecord = async (id: string, actualQuantity: number, note: string) => {
    await fetch(`/api/stocktake/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actualQuantity, note }),
    });
  };

  const completeStockTake = async () => {
    if (!batchId) return;
    if (!confirm("确定完成盘点？库存将更新为实际数量。")) return;
    await fetch(`/api/stocktake/${batchId}`, { method: "POST" });
    setCompleted(true);
    loadHistory();
  };

  if (viewBatch) {
    return <HistoryDetail batchId={viewBatch} onBack={() => setViewBatch(null)} />;
  }

  // 正在进行中的盘点
  if (batchId && !completed) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">盘点中</h1>
          <Button onClick={completeStockTake}>完成盘点</Button>
        </div>

        <div className="space-y-3">
          {records.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold">{r.item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {r.item.code} | {r.item.position ?? "位置未知"} | 账面: {r.expectedQuantity} {r.item.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      className="w-20"
                      value={r.actualQuantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setRecords((prev) =>
                          prev.map((x) =>
                            x.id === r.id
                              ? { ...x, actualQuantity: val, difference: val - x.expectedQuantity }
                              : x
                          )
                        );
                      }}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        updateRecord(r.id, val, r.note ?? "");
                      }}
                    />
                    <span className="text-sm text-muted-foreground">{r.item.unit}</span>
                    {r.difference !== 0 && (
                      <Badge variant={r.difference < 0 ? "destructive" : "default"}>
                        {r.difference > 0 ? "+" : ""}{r.difference}
                      </Badge>
                    )}
                    {r.difference === 0 && <Badge variant="outline">OK</Badge>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // 发起盘点页面
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">盘点</h1>

      <Card className="mb-6">
        <CardHeader><CardTitle>发起新盘点</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Select
                value={categoryId || "null"}
                onValueChange={(v) => setCategoryId(!v || v === "null" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="全盘（所有物料）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">全盘（所有物料）</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={startStockTake}>开始盘点</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>盘点历史</CardTitle></CardHeader>
        <CardContent>
          {history.map((batch) => (
            <div
              key={batch.batchId}
              className="flex justify-between items-center py-2 border-b last:border-0 cursor-pointer hover:bg-muted/50 px-2 rounded"
              onClick={() => setViewBatch(batch.batchId)}
            >
              <div>
                <p className="font-medium">
                  {new Date(batch._min.createdAt).toLocaleString("zh-CN")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {batch._count.id} 项物料
                </p>
              </div>
              <Button variant="ghost" size="sm">查看</Button>
            </div>
          ))}
          {history.length === 0 && (
            <p className="text-center text-muted-foreground py-4">暂无盘点记录</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
