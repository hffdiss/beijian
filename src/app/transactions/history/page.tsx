"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumb } from "@/components/breadcrumb";
import { Pagination } from "@/components/pagination";
import { TableSkeleton } from "@/components/skeleton";
import { useToast } from "@/components/toast";

interface Transaction {
  id: string;
  type: string;
  quantity: number;
  reason: string | null;
  relatedPerson: string | null;
  note: string | null;
  batchId: string | null;
  createdAt: string;
  item: { id: string; code: string; name: string; unit: string };
  project: { id: string; name: string } | null;
  machine: { id: string; machineSn: string } | null;
}

interface BatchGroup {
  batchId: string;
  type: string;
  createdAt: string;
  items: Transaction[];
  totalQty: number;
}

export default function TransactionHistoryPage() {
  const toast = useToast();
  const [data, setData] = useState<{ transactions: Transaction[]; total: number }>({ transactions: [], total: 0 });
  const [stats, setStats] = useState<{ inCount: number; outCount: number; inQty: number; outQty: number }>({ inCount: 0, outCount: 0, inQty: 0, outQty: 0 });
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());

  const toggleSort = (field: string) => {
    if (sort === field) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSort(field); setDir("desc"); }
    setPage(1);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit), sort, dir });
    if (type) params.set("type", type);
    if (q) params.set("q", q);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    const [txnRes, statsRes] = await Promise.all([
      fetch(`/api/transactions?${params}`),
      fetch(`/api/transactions?${new URLSearchParams({ stats: "1", type, dateFrom, dateTo })}`),
    ]);
    const txnData = await txnRes.json();
    setData(txnData);
    try { setStats(await statsRes.json()); } catch {}
    setLoading(false);
  }, [type, q, dateFrom, dateTo, page, limit, sort, dir]);

  useEffect(() => {
    const timer = setTimeout(() => { load(); }, 200);
    return () => clearTimeout(timer);
  }, [load]);

  const handleUndo = async (id: string) => {
    if (!confirm("确定撤销该记录？库存将自动恢复。")) return;
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("撤销失败"); return; }
    toast.success("已撤销");
    load();
  };

  // Group by batch
  const groupByBatch = (txns: Transaction[]): (BatchGroup | Transaction)[] => {
    const batchMap = new Map<string, Transaction[]>();
    const singles: Transaction[] = [];
    txns.forEach((t) => {
      if (t.batchId) {
        const arr = batchMap.get(t.batchId) || [];
        arr.push(t);
        batchMap.set(t.batchId, arr);
      } else { singles.push(t); }
    });
    const groups: BatchGroup[] = [];
    batchMap.forEach((items, batchId) => {
      groups.push({ batchId, type: items[0].type, createdAt: items[0].createdAt, items, totalQty: items.reduce((s, i) => s + i.quantity, 0) });
    });
    const result: (BatchGroup | Transaction)[] = [...groups, ...singles];
    result.sort((a, b) => {
      const da = "batchId" in a ? new Date(a.createdAt).getTime() : new Date(a.createdAt).getTime();
      const db = "batchId" in b ? new Date(b.createdAt).getTime() : new Date(b.createdAt).getTime();
      return sort === "createdAt" ? (dir === "desc" ? db - da : da - db) : 0;
    });
    return result;
  };

  const grouped = groupByBatch(data.transactions);
  const totalPages = Math.ceil(data.total / limit);

  const SortHead = ({ field, label }: { field: string; label: string }) => (
    <TableHead className="cursor-pointer hover:bg-muted/50 select-none" onClick={() => toggleSort(field)}>
      <span className="inline-flex items-center gap-1">{label}{sort === field && <span className="text-xs">{dir === "asc" ? "▲" : "▼"}</span>}</span>
    </TableHead>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Breadcrumb items={[{ label: "出入库记录" }]} />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">出入库记录</h1>
        <div className="flex gap-2">
          <Link href="/transactions/in"><Button size="sm">📥 入库</Button></Link>
          <Link href="/transactions/out"><Button size="sm" variant="secondary">📤 出库</Button></Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-green-600">{stats.inCount}</p><p className="text-xs text-muted-foreground">入库次数</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-green-600">{stats.inQty}</p><p className="text-xs text-muted-foreground">入库数量</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-orange-600">{stats.outCount}</p><p className="text-xs text-muted-foreground">出库次数</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-orange-600">{stats.outQty}</p><p className="text-xs text-muted-foreground">出库数量</p></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Input placeholder="搜索物料名称" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="max-w-[180px] text-sm h-8" />
        <Select value={type || ""} onValueChange={(v) => { setType(!v ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-28 h-8 text-sm"><SelectValue placeholder="类型" /></SelectTrigger>
          <SelectContent><SelectItem value="">全部</SelectItem><SelectItem value="IN">入库</SelectItem><SelectItem value="OUT">出库</SelectItem></SelectContent>
        </Select>
        <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="w-36 h-8 text-sm" title="开始日期" />
        <span className="text-muted-foreground self-center text-sm">—</span>
        <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="w-36 h-8 text-sm" title="结束日期" />
        <Button variant="outline" size="sm" className="h-8" onClick={() => { setQ(""); setType(""); setDateFrom(""); setDateTo(""); setPage(1); }}>清除</Button>
        <Button variant="outline" size="sm" className="h-8" onClick={load}>搜索</Button>
      </div>

      {loading ? (
        <TableSkeleton rows={10} cols={6} />
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortHead field="createdAt" label="时间" />
                  <TableHead>类型</TableHead>
                  <TableHead>物料 / 批次</TableHead>
                  <TableHead>项目</TableHead>
                  <TableHead>数量</TableHead>
                  <TableHead>人员</TableHead>
                  <TableHead>用途</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grouped.map((row) => {
                  if ("batchId" in row) {
                    const batch = row as BatchGroup;
                    const isExpanded = expandedBatches.has(batch.batchId);
                    return (
                      <>
                        <TableRow className="cursor-pointer bg-muted/20 hover:bg-muted/40" onClick={() => {
                          const next = new Set(expandedBatches);
                          isExpanded ? next.delete(batch.batchId) : next.add(batch.batchId);
                          setExpandedBatches(next);
                        }}>
                          <TableCell className="text-sm">{new Date(batch.createdAt).toLocaleString("zh-CN")}</TableCell>
                          <TableCell><Badge variant={batch.type === "IN" ? "default" : "secondary"}>{batch.type === "IN" ? "入库" : "出库"}</Badge></TableCell>
                          <TableCell>
                            <span className="font-medium">{batch.items.length} 种物料</span>
                            <span className="text-xs text-muted-foreground ml-1">({isExpanded ? "▲" : "▼"} 展开)</span>
                          </TableCell>
                          <TableCell className="text-xs">{batch.items[0]?.project?.name ?? "-"}</TableCell>
                          <TableCell><Badge variant="outline">{batch.totalQty}</Badge></TableCell>
                          <TableCell>{batch.items[0].relatedPerson ?? "-"}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">{batch.items[0].reason ?? "-"}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); batch.items.forEach((t) => handleUndo(t.id)); }}>
                              撤销批次
                            </Button>
                          </TableCell>
                        </TableRow>
                        {isExpanded && batch.items.map((t) => (
                          <TableRow key={t.id} className="bg-muted/10">
                            <TableCell className="text-xs text-muted-foreground pl-8">{new Date(t.createdAt).toLocaleTimeString("zh-CN")}</TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-sm">{t.item.name} <span className="text-muted-foreground text-xs">({t.item.code})</span></TableCell>
                            <TableCell>{t.quantity} {t.item.unit}</TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleUndo(t.id); }}>撤销</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    );
                  }
                  const txn = row as Transaction;
                  return (
                    <TableRow key={txn.id}>
                      <TableCell className="text-sm">{new Date(txn.createdAt).toLocaleString("zh-CN")}</TableCell>
                      <TableCell><Badge variant={txn.type === "IN" ? "default" : "secondary"}>{txn.type === "IN" ? "入库" : "出库"}</Badge></TableCell>
                      <TableCell>{txn.item.name} <span className="text-muted-foreground text-xs">({txn.item.code})</span></TableCell>
                      <TableCell className="text-xs">{txn.project?.name ?? "-"}</TableCell>
                      <TableCell>{txn.quantity} {txn.item.unit}</TableCell>
                      <TableCell>{txn.relatedPerson ?? "-"}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">{txn.reason ?? "-"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleUndo(txn.id)}>撤销</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden space-y-3">
            {grouped.map((row) => {
              if ("batchId" in row) {
                const batch = row as BatchGroup;
                return (
                  <Card key={batch.batchId} className="cursor-pointer" onClick={() => {
                    const next = new Set(expandedBatches);
                    expandedBatches.has(batch.batchId) ? next.delete(batch.batchId) : next.add(batch.batchId);
                    setExpandedBatches(next);
                  }}>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <Badge variant={batch.type === "IN" ? "default" : "secondary"}>{batch.type === "IN" ? "入库" : "出库"}</Badge>
                          <span className="font-medium text-sm ml-2">批次 {batch.items.length} 种</span>
                        </div>
                        <Badge variant="outline">{batch.totalQty}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(batch.createdAt).toLocaleString("zh-CN")}</p>
                    </CardContent>
                  </Card>
                );
              }
              const txn = row as Transaction;
              return (
                <Card key={txn.id}>
                  <CardContent className="p-3">
                    <div className="flex justify-between">
                      <div>
                        <Badge variant={txn.type === "IN" ? "default" : "secondary"} className="mr-2">{txn.type === "IN" ? "入库" : "出库"}</Badge>
                        <span className="font-medium text-sm">{txn.item.name}</span>
                      </div>
                      <span className="text-sm">{txn.quantity} {txn.item.unit}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(txn.createdAt).toLocaleString("zh-CN")}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {data.transactions.length === 0 && <p className="text-center text-muted-foreground py-12">暂无记录</p>}

          <Pagination page={page} totalPages={totalPages} total={data.total} limit={limit}
            onPageChange={setPage} onLimitChange={setLimit} />
        </>
      )}
    </div>
  );
}
