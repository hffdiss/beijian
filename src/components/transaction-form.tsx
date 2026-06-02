"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { ItemSelector } from "./item-selector";

interface ItemOption {
  id: string;
  code: string;
  name: string;
  unit: string;
  quantity: number;
  safetyStock: number;
}

interface Row {
  itemId: string;
  itemName: string;
  itemCode: string;
  unit: string;
  quantity: number;
  currentStock: number;
  reason: string;
  relatedPerson: string;
  note: string;
}

interface Props {
  type: "IN" | "OUT";
}

const emptyRow: Row = {
  itemId: "", itemName: "", itemCode: "", unit: "", quantity: 1,
  currentStock: 0, reason: "", relatedPerson: "", note: "",
};

const QTY_PRESETS = [1, 5, 10, 20, 50, 100];

export function TransactionForm({ type }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([{ ...emptyRow }]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const isIn = type === "IN";
  const title = isIn ? "入库" : "出库";

  const addRow = () => setRows([...rows, { ...emptyRow }]);
  const removeRow = (i: number) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, idx) => idx !== i));
  };

  const updateRow = (i: number, field: keyof Row, value: string | number) => {
    setRows((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const validRows = rows.filter((r) => r.itemId && r.quantity > 0);
  const hasEmpty = rows.some((r) => !r.itemId);

  // Outbound stock check
  const overStockRows = !isIn
    ? validRows.filter((r) => r.quantity > r.currentStock && r.currentStock >= 0)
    : [];
  const hasOverStock = overStockRows.length > 0;

  // Calculate stock change preview
  const stockChanges = validRows.map((r) => ({
    ...r,
    newStock: isIn ? r.currentStock + r.quantity : r.currentStock - r.quantity,
  }));

  const totalItems = validRows.length;
  const totalQty = validRows.reduce((s, r) => s + r.quantity, 0);

  const handleSubmitConfirm = async () => {
    setConfirmOpen(false);
    setSubmitting(true);
    setSubmitError("");

    const body = {
      type,
      items: validRows.map((r) => ({
        itemId: r.itemId,
        quantity: r.quantity,
        reason: r.reason,
        relatedPerson: r.relatedPerson,
        note: r.note,
      })),
    };

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      setSubmitError(err.error ?? "操作失败");
      setSubmitting(false);
      return;
    }

    // Success: show feedback, then redirect
    setSubmitted(true);
    setSuccessMsg(`${title}成功！共 ${totalItems} 种物料，${totalQty} 件`);
    setTimeout(() => {
      router.push("/transactions/history");
    }, 1500);
  };

  const handleDeleteRow = (i: number) => {
    if (rows.length <= 1) {
      // Reset instead of remove
      setRows([{ ...emptyRow }]);
    } else {
      removeRow(i);
    }
  };

  if (submitted) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center mt-20">
        <div className="text-5xl mb-4">{isIn ? "📥" : "📤"}</div>
        <h1 className="text-2xl font-bold mb-2">{successMsg}</h1>
        <p className="text-muted-foreground mb-6">正在跳转到出入库记录...</p>
        <Button variant="outline" onClick={() => router.push("/transactions/history")}>
          查看记录
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <Badge variant={isIn ? "default" : "secondary"} className="text-sm">
          {isIn ? "库存增加" : "库存减少"}
        </Badge>
      </div>

      {submitError && (
        <div className="bg-destructive/10 text-destructive rounded-lg p-3 mb-4 text-sm">
          {submitError}
        </div>
      )}

      {/* Summary bar */}
      {validRows.length > 0 && (
        <div className="flex items-center gap-4 mb-4 px-4 py-2 bg-muted/50 rounded-lg text-sm">
          <span>{totalItems} 种物料</span>
          <span className="text-muted-foreground">|</span>
          <span>合计 {totalQty} 件</span>
          {hasOverStock && (
            <>
              <span className="text-muted-foreground">|</span>
              <span className="text-destructive font-medium">⚠ {overStockRows.length} 项库存不足</span>
            </>
          )}
        </div>
      )}

      <Card className="mb-4">
        <CardContent className="p-4">
          {rows.map((row, i) => {
            const isOverStock = !isIn && row.itemId && row.currentStock >= 0 && row.quantity > row.currentStock;
            return (
              <div
                key={i}
                className="mb-3 pb-3 border-b last:border-0 last:mb-0 last:pb-0"
              >
                {/* Row header with delete */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    #{i + 1}
                    {row.itemName && ` — ${row.itemName}`}
                  </span>
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteRow(i)}>
                    {rows.length <= 1 ? "清空" : "删除"}
                  </Button>
                </div>

                {/* Item + Quantity row */}
                <div className="flex flex-col sm:flex-row gap-2 mb-2">
                  <div className="flex-1">
                    <ItemSelector
                      value={row.itemId}
                      onChange={(item) => {
                        updateRow(i, "itemId", item.id);
                        updateRow(i, "itemName", item.name);
                        updateRow(i, "itemCode", item.code);
                        updateRow(i, "unit", item.unit);
                        updateRow(i, "currentStock", item.quantity);
                      }}
                      transactionType={type}
                      placeholder="选择物料"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Stock info */}
                    {row.itemId && (
                      <div className="text-xs text-muted-foreground mr-2 shrink-0">
                        <span className={isOverStock ? "text-destructive font-medium" : ""}>
                          库存 {row.currentStock}
                        </span>
                        <span className="ml-1">{row.unit}</span>
                      </div>
                    )}
                    {/* Quantity presets */}
                    <div className="flex items-center gap-0.5">
                      {QTY_PRESETS.filter((p) => p <= 20).map((p) => (
                        <Button
                          key={p}
                          variant="outline" size="sm"
                          className="h-8 w-9 px-0 text-xs"
                          onClick={() => updateRow(i, "quantity", p)}
                        >
                          {p}
                        </Button>
                      ))}
                    </div>
                    <Input
                      type="number"
                      min={1}
                      value={row.quantity || ""}
                      onChange={(e) => updateRow(i, "quantity", parseInt(e.target.value) || 0)}
                      className={`w-20 ${isOverStock ? "border-destructive" : ""}`}
                    />
                    {row.unit && <span className="text-sm text-muted-foreground shrink-0">{row.unit}</span>}
                  </div>
                </div>

                {/* Over stock warning */}
                {isOverStock && (
                  <p className="text-xs text-destructive mb-2">
                    ⚠ 库存不足（{row.currentStock}），出库 {row.quantity} 将导致负库存
                  </p>
                )}

                {/* Detail fields — collapsible / compact */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Input
                    value={row.reason}
                    onChange={(e) => updateRow(i, "reason", e.target.value)}
                    placeholder={isIn ? "入库原因（可选）" : "用途（可选）"}
                    className="text-sm h-8"
                  />
                  <Input
                    value={row.relatedPerson}
                    onChange={(e) => updateRow(i, "relatedPerson", e.target.value)}
                    placeholder={isIn ? "采购/送货人（可选）" : "领用人（可选）"}
                    className="text-sm h-8"
                  />
                  <Input
                    value={row.note}
                    onChange={(e) => updateRow(i, "note", e.target.value)}
                    placeholder="备注（可选）"
                    className="text-sm h-8"
                  />
                </div>
              </div>
            );
          })}

          <Button variant="outline" size="sm" onClick={addRow} className="mt-2">
            + 添加物料
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()}>取消</Button>
        <Button
          onClick={() => setConfirmOpen(true)}
          disabled={submitting || validRows.length === 0}
        >
          {submitting ? "提交中..." : `确认${title}`}
        </Button>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>确认{title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground border-b pb-2">
              <span className="col-span-4">物料</span>
              <span className="col-span-2 text-right">库存</span>
              <span className="col-span-2 text-center">数量</span>
              <span className="col-span-2 text-right">变更后</span>
              <span className="col-span-2">单位</span>
            </div>
            {stockChanges.map((r, i) => {
              const isOver = !isIn && r.newStock < 0;
              return (
                <div key={i} className="grid grid-cols-12 gap-2 text-sm items-center">
                  <span className="col-span-4 font-medium truncate">{r.itemName}</span>
                  <span className="col-span-2 text-right text-muted-foreground">{r.currentStock}</span>
                  <span className="col-span-2 text-center">
                    <Badge variant={isIn ? "default" : "secondary"} className="text-xs">
                      {isIn ? "+" : "-"}{r.quantity}
                    </Badge>
                  </span>
                  <span className={`col-span-2 text-right font-mono ${isOver ? "text-destructive font-bold" : ""}`}>
                    {r.newStock}
                  </span>
                  <span className="col-span-2 text-muted-foreground">{r.unit}</span>
                  {r.reason && (
                    <span className="col-span-12 text-xs text-muted-foreground truncate">
                      {isIn ? "原因" : "用途"}: {r.reason}
                      {r.relatedPerson && ` | ${isIn ? "送货人" : "领用人"}: ${r.relatedPerson}`}
                    </span>
                  )}
                </div>
              );
            })}
            <div className="border-t pt-2 flex justify-between text-sm font-medium">
              <span>合计</span>
              <span>{totalItems} 种，{totalQty} 件</span>
            </div>
            {hasOverStock && (
              <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                ⚠ 有 {overStockRows.length} 项物料库存不足，出库后将出现负库存。确定继续？
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>取消</Button>
            <Button onClick={handleSubmitConfirm} disabled={submitting}>
              确认{title}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
