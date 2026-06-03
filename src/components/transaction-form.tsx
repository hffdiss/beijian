"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Breadcrumb } from "@/components/breadcrumb";
import { useToast } from "@/components/toast";

interface ItemOption {
  id: string; code: string; name: string; unit: string; quantity: number; safetyStock: number;
}

interface CartItem {
  itemId: string; itemName: string; itemCode: string; unit: string;
  quantity: number; currentStock: number;
}

interface Props { type: "IN" | "OUT"; }

export function TransactionForm({ type }: Props) {
  const router = useRouter();
  const toast = useToast();
  const isIn = type === "IN";
  const title = isIn ? "入库" : "出库";

  // Browse panel
  const [items, setItems] = useState<ItemOption[]>([]);
  const [search, setSearch] = useState("");
  const [browseLoading, setBrowseLoading] = useState(false);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [reason, setReason] = useState("");
  const [relatedPerson, setRelatedPerson] = useState("");
  const [note, setNote] = useState("");

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ batchId: string; totalItems: number; totalQty: number } | null>(null);
  const [submitError, setSubmitError] = useState("");

  // Load items for browse
  useEffect(() => {
    const timer = setTimeout(async () => {
      setBrowseLoading(true);
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("q", search);
      const res = await fetch(`/api/items?${params}`);
      const json = await res.json();
      setItems(Array.isArray(json) ? json : json.items ?? []);
      setBrowseLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Cart operations
  const addToCart = (item: ItemOption) => {
    const existing = cart.find((c) => c.itemId === item.id);
    if (existing) {
      updateCartItem(item.id, existing.quantity + 1);
    } else {
      setCart([...cart, { itemId: item.id, itemName: item.name, itemCode: item.code, unit: item.unit, quantity: 1, currentStock: item.quantity }]);
    }
  };

  const removeFromCart = (itemId: string) => setCart(cart.filter((c) => c.itemId !== itemId));
  const updateCartItem = (itemId: string, quantity: number) => {
    setCart(cart.map((c) => (c.itemId === itemId ? { ...c, quantity: Math.max(1, quantity) } : c)));
  };

  const totalItems = cart.length;
  const totalQty = cart.reduce((s, c) => s + c.quantity, 0);
  const overStockItems = !isIn ? cart.filter((c) => c.quantity > c.currentStock) : [];

  // Submit
  const handleSubmitConfirm = async () => {
    setConfirmOpen(false);
    setSubmitting(true);
    setSubmitError("");

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        items: cart.map((c) => ({ itemId: c.itemId, quantity: c.quantity, reason, relatedPerson, note })),
      }),
    });

    if (!res.ok) { const err = await res.json(); toast.error(err.error ?? "操作失败"); setSubmitting(false); return; }
    const data = await res.json();
    toast.success(`${title}成功！${totalItems} 种物料，${totalQty} 件`);
    setSubmitResult({ batchId: data.batchId, totalItems, totalQty });
    setSubmitting(false);
  };

  if (submitResult) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center mt-16">
        <div className="text-6xl mb-4">{isIn ? "📥" : "📤"}</div>
        <h1 className="text-2xl font-bold mb-2">{title}成功</h1>
        <p className="text-muted-foreground mb-1">{submitResult.totalItems} 种物料，共 {submitResult.totalQty} 件</p>
        <p className="text-xs text-muted-foreground mb-8">批次: {submitResult.batchId}</p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => router.push("/transactions/history")}>查看记录</Button>
          <Button onClick={() => { setSubmitResult(null); setCart([]); setReason(""); setRelatedPerson(""); setNote(""); }}>继续{title}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      <Breadcrumb items={[{ label: "出入库记录", href: "/transactions/history" }, { label: title }]} />
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        <Badge variant={isIn ? "default" : "secondary"}>{isIn ? "库存增加" : "库存减少"}</Badge>
      </div>

      {submitError && <div className="bg-destructive/10 text-destructive rounded-lg p-3 mb-4 text-sm">{submitError}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Browse items */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">物料列表</CardTitle>
              <span className="text-xs text-muted-foreground">{items.length} 种</span>
            </div>
            <Input
              placeholder="搜索名称/编号..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-2"
              autoFocus
            />
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[55vh] overflow-y-auto">
              {browseLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">搜索中...</div>
              ) : items.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">{search ? "无匹配物料" : "输入关键词搜索"}</div>
              ) : (
                items.map((item) => {
                  const inCart = cart.find((c) => c.itemId === item.id);
                  const lowStock = !isIn && item.quantity <= item.safetyStock && item.safetyStock > 0;
                  const outOfStock = !isIn && item.quantity <= 0;
                  return (
                    <button
                      key={item.id}
                      onClick={() => !outOfStock && addToCart(item)}
                      disabled={outOfStock}
                      className={`w-full text-left px-4 py-2.5 border-b last:border-0 hover:bg-muted/50 transition-colors flex items-center justify-between ${inCart ? "bg-primary/5" : ""} ${outOfStock ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{item.name}</span>
                          {inCart && <Badge className="text-xs shrink-0">已添加</Badge>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground font-mono">{item.code}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {outOfStock ? (
                          <Badge variant="destructive" className="text-xs">无库存</Badge>
                        ) : lowStock ? (
                          <Badge variant="destructive" className="text-xs">{item.quantity}</Badge>
                        ) : (
                          <span className={`text-sm font-medium ${isIn ? "text-green-600" : ""}`}>{item.quantity}</span>
                        )}
                        <span className="text-xs text-muted-foreground">{item.unit}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Cart */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{title}清单</CardTitle>
              {cart.length > 0 && (
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => setCart([])}>清空</Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {cart.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-4xl mb-3">{isIn ? "📥" : "📤"}</p>
                <p className="text-sm">点击左侧物料添加到{title}清单</p>
              </div>
            ) : (
              <>
                <div className="max-h-[38vh] overflow-y-auto">
                  {cart.map((c) => {
                    const isOver = !isIn && c.quantity > c.currentStock;
                    return (
                      <div key={c.itemId} className="px-4 py-2.5 border-b last:border-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm truncate flex-1">{c.itemName}</span>
                          <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-destructive shrink-0 ml-2" onClick={() => removeFromCart(c.itemId)}>移除</Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            库存 <span className={isOver ? "text-destructive font-medium" : ""}>{c.currentStock}</span> {c.unit}
                          </span>
                          <div className="flex items-center gap-1 ml-auto">
                            <Button variant="outline" size="sm" className="h-7 w-7 px-0 text-sm" onClick={() => updateCartItem(c.itemId, c.quantity - 1)} disabled={c.quantity <= 1}>−</Button>
                            <Input type="number" min={1} value={c.quantity}
                              onChange={(e) => updateCartItem(c.itemId, parseInt(e.target.value) || 1)}
                              className={`w-16 h-7 text-sm text-center ${isOver ? "border-destructive" : ""}`} />
                            <Button variant="outline" size="sm" className="h-7 w-7 px-0 text-sm" onClick={() => updateCartItem(c.itemId, c.quantity + 1)}>+</Button>
                          </div>
                        </div>
                        {isOver && <p className="text-xs text-destructive mt-1">⚠ 库存不足</p>}
                      </div>
                    );
                  })}
                </div>

                {/* Info fields */}
                <div className="border-t px-4 py-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={reason} onChange={(e) => setReason(e.target.value)}
                      placeholder={isIn ? "入库原因" : "用途"} className="text-sm h-8" />
                    <Input value={relatedPerson} onChange={(e) => setRelatedPerson(e.target.value)}
                      placeholder={isIn ? "送货人" : "领用人"} className="text-sm h-8" />
                  </div>
                  <Input value={note} onChange={(e) => setNote(e.target.value)}
                    placeholder="备注（可选）" className="text-sm h-8" />
                </div>

                {/* Summary + Submit */}
                <div className="border-t px-4 py-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm">
                      <span className="font-medium">{totalItems}</span>
                      <span className="text-muted-foreground"> 种 · 共 </span>
                      <span className="font-medium">{totalQty}</span>
                      <span className="text-muted-foreground"> 件</span>
                    </div>
                    {overStockItems.length > 0 && (
                      <Badge variant="destructive" className="text-xs">⚠ {overStockItems.length} 项不足</Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => router.back()}>取消</Button>
                    <Button className="flex-1" onClick={() => setConfirmOpen(true)} disabled={submitting || cart.length === 0}>
                      {submitting ? "提交中..." : `确认${title}`}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>确认{title}</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[40vh] overflow-y-auto">
            {cart.map((c) => (
              <div key={c.itemId} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                <span className="font-medium truncate flex-1">{c.itemName}</span>
                <span className="text-muted-foreground mx-2">{c.quantity} {c.unit}</span>
                <span className="text-muted-foreground text-xs">→ {isIn ? c.currentStock + c.quantity : c.currentStock - c.quantity}</span>
              </div>
            ))}
            <div className="pt-2 font-medium text-sm flex justify-between">
              <span>合计</span><span>{totalItems} 种 · {totalQty} 件</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>取消</Button>
            <Button onClick={handleSubmitConfirm} disabled={submitting}>确认{title}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
