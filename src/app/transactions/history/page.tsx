"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Breadcrumb } from "@/components/breadcrumb";
import { Pagination } from "@/components/pagination";

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
}

export default function TransactionHistoryPage() {
  const [data, setData] = useState<{ transactions: Transaction[]; total: number }>({
    transactions: [], total: 0,
  });
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (type) params.set("type", type);
    const res = await fetch(`/api/transactions?${params}`);
    setData(await res.json());
  }, [type, page]);

  useEffect(() => { load(); }, [load]);

  const handleUndo = async (id: string) => {
    if (!confirm("确定撤销该记录？库存将自动恢复。")) return;
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    load();
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString("zh-CN");

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Breadcrumb items={[{ label: "出入库记录" }]} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">出入库记录</h1>
        <Select
          value={type || "null"}
          onValueChange={(v) => { setType(!v || v === "null" ? "" : v); setPage(1); }}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="全部类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="null">全部类型</SelectItem>
            <SelectItem value="IN">入库</SelectItem>
            <SelectItem value="OUT">出库</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>时间</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>物料</TableHead>
            <TableHead>数量</TableHead>
            <TableHead>领用人</TableHead>
            <TableHead>用途</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.transactions.map((txn) => (
            <TableRow key={txn.id}>
              <TableCell className="text-sm">{formatDate(txn.createdAt)}</TableCell>
              <TableCell>
                <Badge variant={txn.type === "IN" ? "default" : "secondary"}>
                  {txn.type === "IN" ? "入库" : "出库"}
                </Badge>
              </TableCell>
              <TableCell>{txn.item.name} <span className="text-muted-foreground text-sm">({txn.item.code})</span></TableCell>
              <TableCell>{txn.quantity} {txn.item.unit}</TableCell>
              <TableCell>{txn.relatedPerson ?? "-"}</TableCell>
              <TableCell className="max-w-[200px] truncate">{txn.reason ?? "-"}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" onClick={() => handleUndo(txn.id)}>
                  撤销
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {data.transactions.length === 0 && (
        <p className="text-center text-muted-foreground py-12">暂无记录</p>
      )}

      <Pagination
        page={page} totalPages={Math.ceil(data.total / 50)} total={data.total} limit={50}
        onPageChange={setPage} onLimitChange={() => {}}
      />
    </div>
  );
}
