"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PartItem {
  id: string;
  partSn: string;
  description: string | null;
  model: string | null;
  isSpare: boolean;
  spareStatus: string | null;
  spareWarehouse: string | null;
  project: { name: string } | null;
  machine: { machineSn: string } | null;
  bom: { name: string | null } | null;
}

export default function PartsPage() {
  const [data, setData] = useState<{ parts: PartItem[]; total: number }>({ parts: [], total: 0 });
  const [q, setQ] = useState("");
  const [spareStatus, setSpareStatus] = useState("");
  const [spareWarehouse, setSpareWarehouse] = useState("");
  const [isSpare, setIsSpare] = useState("");
  const [equipmentCategory, setEquipmentCategory] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (q) params.set("q", q);
    if (spareStatus) params.set("spareStatus", spareStatus);
    if (spareWarehouse) params.set("spareWarehouse", spareWarehouse);
    if (isSpare) params.set("isSpare", isSpare);
    if (equipmentCategory) params.set("equipmentCategory", equipmentCategory);
    const res = await fetch(`/api/parts?${params}`);
    setData(await res.json());
  }, [q, spareStatus, spareWarehouse, isSpare, equipmentCategory, page]);

  useEffect(() => {
    const timer = setTimeout(() => { load(); }, 300);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">部件管理</h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <Input
          placeholder="多词搜索: SN/描述/型号/项目/机器..."
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          className="max-w-sm"
        />
        <Select value={equipmentCategory || "null"} onValueChange={(v) => { setEquipmentCategory(!v || v === "null" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="类别" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="null">全部类别</SelectItem>
            <SelectItem value="NVME SSD">NVME SSD</SelectItem>
            <SelectItem value="SATA SSD">SATA SSD</SelectItem>
            <SelectItem value="SAS SSD">SAS SSD</SelectItem>
            <SelectItem value="SATA HDD">SATA HDD</SelectItem>
            <SelectItem value="SAS HDD">SAS HDD</SelectItem>
            <SelectItem value="内存">内存</SelectItem>
            <SelectItem value="傲腾内存">傲腾内存</SelectItem>
            <SelectItem value="扩展卡">扩展卡</SelectItem>
            <SelectItem value="PSU">PSU</SelectItem>
            <SelectItem value="光模块">光模块</SelectItem>
            <SelectItem value="线缆">线缆</SelectItem>
          </SelectContent>
        </Select>
        <Select value={spareStatus || "null"} onValueChange={(v) => { setSpareStatus(!v || v === "null" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="备件状态" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="null">全部状态</SelectItem>
            <SelectItem value="OK">OK</SelectItem>
            <SelectItem value="POK">POK</SelectItem>
            <SelectItem value="NG">NG</SelectItem>
            <SelectItem value="不涉及">不涉及</SelectItem>
          </SelectContent>
        </Select>
        <Select value={spareWarehouse || "null"} onValueChange={(v) => { setSpareWarehouse(!v || v === "null" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="备件库房" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="null">全部库房</SelectItem>
            <SelectItem value="成都">成都</SelectItem>
            <SelectItem value="现场备件">现场备件</SelectItem>
          </SelectContent>
        </Select>
        <Select value={isSpare || "null"} onValueChange={(v) => { setIsSpare(!v || v === "null" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-32"><SelectValue placeholder="是否备件" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="null">全部</SelectItem>
            <SelectItem value="true">是</SelectItem>
            <SelectItem value="false">否</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="secondary" onClick={load}>搜索</Button>
      </div>

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>部件SN</TableHead>
              <TableHead>描述</TableHead>
              <TableHead>型号</TableHead>
              <TableHead>项目</TableHead>
              <TableHead>机器SN</TableHead>
              <TableHead>备件</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>库房</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.parts.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-sm">
                  <Link href={`/parts/${p.id}`} className="hover:underline">{p.partSn}</Link>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">{p.description ?? "-"}</TableCell>
                <TableCell className="text-muted-foreground">{p.model ?? "-"}</TableCell>
                <TableCell className="text-sm">{p.project?.name ?? "-"}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{p.machine?.machineSn ?? "-"}</TableCell>
                <TableCell>{p.isSpare ? <Badge>是</Badge> : <Badge variant="outline">否</Badge>}</TableCell>
                <TableCell><Badge variant={p.spareStatus === "NG" ? "destructive" : "secondary"}>{p.spareStatus ?? "-"}</Badge></TableCell>
                <TableCell className="text-muted-foreground text-sm">{p.spareWarehouse ?? "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden space-y-3">
        {data.parts.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-4">
              <Link href={`/parts/${p.id}`} className="font-mono font-semibold text-sm hover:underline">{p.partSn}</Link>
              <p className="text-sm text-muted-foreground truncate">{p.description ?? "-"}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">{p.project?.name ?? "-"}</Badge>
                <Badge variant={p.spareStatus === "NG" ? "destructive" : "secondary"}>{p.spareStatus ?? "-"}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.total > 50 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>上一页</Button>
          <span className="text-sm text-muted-foreground self-center">{page} / {Math.ceil(data.total / 50)}</span>
          <Button variant="outline" size="sm" disabled={page * 50 >= data.total} onClick={() => setPage((p) => p + 1)}>下一页</Button>
        </div>
      )}
    </div>
  );
}
