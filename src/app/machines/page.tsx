"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Breadcrumb } from "@/components/breadcrumb";

interface Machine {
  id: string;
  machineSn: string;
  manufacturerSn: string | null;
  product: string | null;
  modelCode: string | null;
  manufacturer: string | null;
  project: { name: string };
  _count: { parts: number };
}

export default function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const res = await fetch(`/api/machines?${params}`);
    setMachines(await res.json());
    setLoading(false);
  }, [q]);

  const handleSearch = () => {
    setHasSearched(true);
    load();
  };

  useEffect(() => {
    if (hasSearched) {
      const timer = setTimeout(() => { load(); }, 300);
      return () => clearTimeout(timer);
    }
  }, [load, hasSearched]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Breadcrumb items={[{ label: "机器管理" }]} />
      <h1 className="text-2xl font-bold mb-6">机器管理</h1>

      <div className="flex gap-3 mb-4">
        <Input
          placeholder="输入机器SN或产品名后按回车搜索..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="max-w-sm"
        />
        <Button variant="secondary" onClick={handleSearch}>搜索</Button>
      </div>

      {!hasSearched ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-lg font-medium mb-2">输入搜索条件开始查询</p>
          <p className="text-sm">支持按机器SN、产品名称搜索</p>
        </div>
      ) : loading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 py-3 border-b"><div className="h-4 bg-muted rounded flex-1" /><div className="h-4 bg-muted rounded flex-1" /><div className="h-4 bg-muted rounded flex-1" /></div>
          ))}
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>整机SN</TableHead>
                  <TableHead>厂商SN</TableHead>
                  <TableHead>产品</TableHead>
                  <TableHead>型号代码</TableHead>
                  <TableHead>厂商</TableHead>
                  <TableHead>项目</TableHead>
                  <TableHead>部件数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {machines.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-sm">
                      <Link href={`/machines/${m.id}`} className="hover:underline">{m.machineSn}</Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{m.manufacturerSn ?? "-"}</TableCell>
                    <TableCell>{m.product ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{m.modelCode ?? "-"}</TableCell>
                    <TableCell>{m.manufacturer ?? "-"}</TableCell>
                    <TableCell>
                      <Link href={`/projects`} className="text-sm hover:underline">{m.project.name}</Link>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{m._count.parts}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="md:hidden space-y-3">
            {machines.map((m) => (
              <Card key={m.id}>
                <CardContent className="p-4">
                  <Link href={`/machines/${m.id}`} className="font-mono font-semibold text-sm hover:underline">{m.machineSn}</Link>
                  <p className="text-sm text-muted-foreground">{m.product ?? "-"} | {m.manufacturer ?? "-"}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{m.project.name}</Badge>
                    <Badge variant="secondary">{m._count.parts} 部件</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {machines.length === 0 && <p className="text-center text-muted-foreground py-12">未找到机器</p>}
        </>
      )}
    </div>
  );
}
