"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Breadcrumb } from "@/components/breadcrumb";
import { useToast } from "@/components/toast";

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
  id: string; name: string; parentId: string | null;
}

interface BatchItem {
  batchId: string;
  _count: { id: number };
  _min: { createdAt: string };
}

function HistoryDetail({ batchId, onBack }: { batchId: string; onBack: () => void }) {
  const [records, setRecords] = useState<StockTakeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stocktake?batchId=${batchId}`)
      .then((r) => r.json()).then(setRecords).finally(() => setLoading(false));
  }, [batchId]);

  const matched = records.filter((r) => r.difference === 0).length;
  const diffCount = records.length - matched;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Breadcrumb items={[{ label: "盘点", href: "/stocktake" }, { label: "盘点详情" }]} />
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={onBack}>&larr; 返回</Button>
        <h1 className="text-2xl font-bold">盘点详情</h1>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (<div key={i} className="h-16 bg-muted rounded-lg" />))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold">{records.length}</p><p className="text-xs text-muted-foreground">总项数</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-green-600">{matched}</p><p className="text-xs text-muted-foreground">一致</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-destructive">{diffCount}</p><p className="text-xs text-muted-foreground">差异</p></CardContent></Card>
          </div>
          <div className="space-y-2">
            {records.map((r) => (
              <div key={r.id} className={`p-4 rounded-lg border ${r.difference !== 0 ? "bg-destructive/5 border-destructive/30" : ""}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{r.item.name}</p>
                    <p className="text-sm text-muted-foreground">{r.item.code} | {r.item.position ?? "位置未知"}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span>账面: {r.expectedQuantity}</span>
                    <span>实际: {r.actualQuantity}</span>
                    <Badge variant={r.difference !== 0 ? "destructive" : "outline"}>
                      {r.difference !== 0 ? (r.difference > 0 ? `+${r.difference}` : r.difference) : "一致"}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function StockTakePage() {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [records, setRecords] = useState<StockTakeRecord[]>([]);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [history, setHistory] = useState<BatchItem[]>([]);
  const [viewBatch, setViewBatch] = useState<string | null>(null);
  const [search, setSearch] = useState("");

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
    if (data.error) { toast.error(data.error); return; }
    setBatchId(data.batchId);
    setCompleted(false);
    setSearch("");
    loadRecords(data.batchId);
    toast.success(`已创建盘点批次，共 ${data.count} 项`);
  };

  const loadRecords = async (bid: string) => {
    const res = await fetch(`/api/stocktake?batchId=${bid}`);
    setRecords(await res.json());
  };

  const updateRecord = (id: string, actualQuantity: number) => {
    fetch(`/api/stocktake/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actualQuantity }),
    });
  };

  const handleQuantityChange = (id: string, val: number) => {
    setRecords((prev) =>
      prev.map((x) => (x.id === id ? { ...x, actualQuantity: val, difference: val - x.expectedQuantity } : x))
    );
  };

  // Batch fill: set all actual = expected
  const fillAllAsExpected = () => {
    setRecords((prev) =>
      prev.map((r) => ({ ...r, actualQuantity: r.expectedQuantity, difference: 0 }))
    );
    records.forEach((r) => {
      if (r.actualQuantity !== r.expectedQuantity) updateRecord(r.id, r.expectedQuantity);
    });
    toast.success("已全部填充为账面数量");
  };

  const completeStockTake = async () => {
    if (!batchId) return;
    const diffCount = records.filter((r) => r.difference !== 0).length;
    const msg = diffCount > 0
      ? `确定完成盘点？有 ${diffCount} 项存在差异，库存将更新为实际数量。`
      : "确定完成盘点？库存将更新为实际数量。";
    if (!confirm(msg)) return;
    await fetch(`/api/stocktake/${batchId}`, { method: "POST" });
    setCompleted(true);
    loadHistory();
    toast.success("盘点完成");
  };

  // Filter
  const filtered = search
    ? records.filter((r) => r.item.name.includes(search) || r.item.code.includes(search) || (r.item.position ?? "").includes(search))
    : records;

  const checked = records.filter((r) => r.actualQuantity !== r.expectedQuantity).length;
  const diffCount = records.filter((r) => r.difference !== 0).length;

  if (viewBatch) {
    return <HistoryDetail batchId={viewBatch} onBack={() => setViewBatch(null)} />;
  }

  // Active stocktake
  if (batchId && !completed) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Breadcrumb items={[{ label: "盘点", href: "/stocktake" }, { label: "盘点中" }]} />
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">盘点中</h1>
          <Button onClick={completeStockTake} variant="default">完成盘点</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold">{records.length}</p><p className="text-xs text-muted-foreground">总项数</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold text-green-600">{records.length - diffCount}</p><p className="text-xs text-muted-foreground">一致</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold text-destructive">{diffCount}</p><p className="text-xs text-muted-foreground">差异</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold">{checked}</p><p className="text-xs text-muted-foreground">已核</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold">{Math.round((checked / records.length) * 100)}%</p><p className="text-xs text-muted-foreground">进度</p></CardContent></Card>
        </div>

        {/* Search + Fill */}
        <div className="flex gap-2 mb-4">
          <Input placeholder="搜索物料名称/编号/位置..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          <Button variant="outline" size="sm" onClick={fillAllAsExpected}>📋 全部填充账面</Button>
        </div>

        <div className="space-y-2">
          {filtered.map((r) => {
            const hasDiff = r.difference !== 0;
            return (
              <div key={r.id} className={`p-3 rounded-lg border ${hasDiff ? "bg-destructive/5 border-destructive/30" : ""}`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{r.item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.item.code} | {r.item.position ?? "位置未知"} | 账面: <span className="font-medium">{r.expectedQuantity}</span> {r.item.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Input
                      type="number" min={0}
                      className={`w-20 h-8 text-sm ${hasDiff ? "border-destructive" : ""}`}
                      value={r.actualQuantity}
                      onChange={(e) => handleQuantityChange(r.id, parseInt(e.target.value) || 0)}
                      onBlur={(e) => updateRecord(r.id, parseInt(e.target.value) || 0)}
                    />
                    <span className="text-xs text-muted-foreground w-8">{r.item.unit}</span>
                    {hasDiff ? (
                      <Badge variant="destructive" className="w-14 justify-center">
                        {r.difference > 0 ? "+" : ""}{r.difference}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="w-14 justify-center text-green-600">OK</Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && search && (
          <p className="text-center text-muted-foreground py-8">无匹配物料</p>
        )}
      </div>
    );
  }

  // Main page
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Breadcrumb items={[{ label: "盘点" }]} />
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
                <p className="font-medium">{new Date(batch._min.createdAt).toLocaleString("zh-CN")}</p>
                <p className="text-sm text-muted-foreground">{batch._count.id} 项物料</p>
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
