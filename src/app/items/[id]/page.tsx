"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ItemFormDialog } from "@/components/item-form-dialog";
import { Breadcrumb } from "@/components/breadcrumb";

interface Transaction {
  id: string;
  type: string;
  quantity: number;
  reason: string | null;
  relatedPerson: string | null;
  note: string | null;
  createdAt: string;
}

interface Item {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sn: string | null;
  model: string | null;
  manufacturer: string | null;
  unit: string;
  quantity: number;
  safetyStock: number;
  position: string | null;
  supplier: string | null;
  price: number | null;
  warrantyStart: string | null;
  warrantyEnd: string | null;
  nandType: string | null;
  compatibleProducts: string | null;
  bomCode: string | null;
  category: { id: string; name: string };
  transactions: Transaction[];
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string; name: string; parentId: string | null;
}

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const load = () => {
    fetch(`/api/items/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) { setError(data.error); } else { setItem(data); }
      })
      .catch(() => setError("加载失败"));
  };

  useEffect(() => {
    load();
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("确定删除该物料？此操作不可撤销。")) return;
    const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
    if (!res.ok) { const err = await res.json(); alert(err.error); return; }
    router.push("/items");
  };

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/items">
          <Button variant="outline">&larr; 返回列表</Button>
        </Link>
      </div>
    );
  }

  if (!item) return <div className="p-6">加载中...</div>;

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("zh-CN") : "-";

  const warrantyStatus = () => {
    if (!item.warrantyEnd) return null;
    const end = new Date(item.warrantyEnd);
    const now = new Date();
    const days = Math.ceil((end.getTime() - now.getTime()) / 86400000);
    if (days < 0) return <Badge variant="destructive">维保已过期</Badge>;
    if (days < 30) return <Badge variant="outline" className="border-yellow-500 text-yellow-600">维保即将到期 ({days}天)</Badge>;
    return <Badge variant="secondary">维保中</Badge>;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Breadcrumb items={[
        { label: "物料管理", href: "/items" },
        { label: item?.name ?? "加载中..." },
      ]} />
      <div className="flex items-center gap-3 mb-6">
        <Link href="/items">
          <Button variant="ghost" size="sm">&larr; 返回</Button>
        </Link>
        <h1 className="text-2xl font-bold">{item.name}</h1>
        {warrantyStatus()}
        {item.quantity <= item.safetyStock && item.safetyStock > 0 && (
          <Badge variant="destructive">库存不足</Badge>
        )}
        <div className="flex-1" />
        <Button variant="outline" onClick={() => setEditOpen(true)}>编辑</Button>
        <Button variant="destructive" onClick={handleDelete}>删除</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">当前库存</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {item.quantity}
              <span className="text-base font-normal text-muted-foreground ml-1">{item.unit}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              安全库存: {item.safetyStock} {item.unit}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">参考单价</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {item.price ? `¥${item.price}` : "-"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">库存总值</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {item.price ? `¥${(item.price * item.quantity).toFixed(2)}` : "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 基本信息 */}
      <Card className="mb-6">
        <CardHeader><CardTitle>基本信息</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-muted-foreground">编号:</span> {item.code}</div>
            <div><span className="text-muted-foreground">分类:</span> {item.category.name}</div>
            <div><span className="text-muted-foreground">型号:</span> {item.model ?? "-"}</div>
            <div><span className="text-muted-foreground">SN:</span> {item.sn ?? "-"}</div>
            <div><span className="text-muted-foreground">厂商:</span> {item.manufacturer ?? "-"}</div>
            <div><span className="text-muted-foreground">供应商:</span> {item.supplier ?? "-"}</div>
            <div><span className="text-muted-foreground">位置:</span> {item.position ?? "-"}</div>
            <div><span className="text-muted-foreground">SSD 颗粒:</span> {item.nandType ?? "-"}</div>
            <div><span className="text-muted-foreground">维保起始:</span> {formatDate(item.warrantyStart)}</div>
            <div><span className="text-muted-foreground">维保截止:</span> {formatDate(item.warrantyEnd)}</div>
            <div className="col-span-2">
              <span className="text-muted-foreground">适用产品:</span> {item.compatibleProducts ?? "-"}
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">描述:</span> {item.description ?? "-"}
            </div>
            <div>
              <span className="text-muted-foreground">关联BOM:</span> {item.bomCode ? (
                <Link href={`/boms?q=${item.bomCode}`} className="font-mono hover:underline text-sm">{item.bomCode}</Link>
              ) : "-"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 出入库记录 */}
      <Card>
        <CardHeader><CardTitle>最近出入库记录</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>时间</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>数量</TableHead>
                <TableHead>领用人</TableHead>
                <TableHead>用途</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {item.transactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell>{formatDate(txn.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant={txn.type === "IN" ? "default" : "secondary"}>
                      {txn.type === "IN" ? "入库" : "出库"}
                    </Badge>
                  </TableCell>
                  <TableCell>{txn.quantity}</TableCell>
                  <TableCell>{txn.relatedPerson ?? "-"}</TableCell>
                  <TableCell>{txn.reason ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {item.transactions.length === 0 && (
            <p className="text-center text-muted-foreground py-4">暂无记录</p>
          )}
        </CardContent>
      </Card>

      <ItemFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        item={item}
        categories={categories}
        onSaved={load}
      />
    </div>
  );
}
