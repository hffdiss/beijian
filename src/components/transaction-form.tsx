"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { ItemSelector } from "./item-selector";
import { Breadcrumb } from "@/components/breadcrumb";
import { useToast } from "@/components/toast";

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

interface TemplateItem { itemId: string; itemName: string; itemCode: string; unit: string; quantity: number; }

interface Template {
  name: string;
  items: TemplateItem[];
}

const emptyRow: Row = {
  itemId: "", itemName: "", itemCode: "", unit: "", quantity: 1,
  currentStock: 0, reason: "", relatedPerson: "", note: "",
};

const QTY_PRESETS = [1, 5, 10, 20, 50, 100];

export function TransactionForm({ type }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>([{ ...emptyRow }]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ batchId: string; totalItems: number; totalQty: number } | null>(null);
  const [submitError, setSubmitError] = useState("");

  // Templates
  const [templates, setTemplates] = useState<Template[]>([]);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const isIn = type === "IN";
  const title = isIn ? "入库" : "出库";
  const STORAGE_KEY = `beijian_templates_${type}`;

  useEffect(() => {
    try {
      setTemplates(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"));
    } catch { setTemplates([]); }
  }, [STORAGE_KEY]);

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

  const overStockRows = !isIn
    ? validRows.filter((r) => r.quantity > r.currentStock && r.currentStock >= 0)
    : [];
  const hasOverStock = overStockRows.length > 0;

  const stockChanges = validRows.map((r) => ({
    ...r,
    newStock: isIn ? r.currentStock + r.quantity : r.currentStock - r.quantity,
  }));

  const totalItems = validRows.length;
  const totalQty = validRows.reduce((s, r) => s + r.quantity, 0);

  // ── Save template ──
  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    const items: TemplateItem[] = validRows.map((r) => ({
      itemId: r.itemId, itemName: r.itemName, itemCode: r.itemCode, unit: r.unit, quantity: r.quantity,
    }));
    const updated = [...templates, { name: templateName.trim(), items }];
    setTemplates(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSaveTemplateOpen(false);
    setTemplateName("");
    toast.success(`模板"${templateName.trim()}"已保存`);
  };

  const handleLoadTemplate = (tpl: Template) => {
    const newRows: Row[] = tpl.items.map((item) => ({
      ...emptyRow,
      itemId: item.itemId, itemName: item.itemName, itemCode: item.itemCode,
      unit: item.unit, quantity: item.quantity,
    }));
    // Replace empty first row or append
    if (rows.length === 1 && !rows[0].itemId) {
      setRows(newRows);
    } else {
      setRows([...rows, ...newRows]);
    }
    toast.success(`已加载模板"${tpl.name}"`);
  };

  const handleDeleteTemplate = (idx: number) => {
    const updated = templates.filter((_, i) => i !== idx);
    setTemplates(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // ── Submit ──
  const handleSubmitConfirm = async () => {
    setConfirmOpen(false);
    setSubmitting(true);
    setSubmitError("");

    const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const body = {
      type,
      idempotencyKey,
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
      toast.error(err.error ?? "操作失败");
      setSubmitting(false);
      return;
    }

    const data = await res.json();
    toast.success(`${title}成功！共 ${totalItems} 种物料，${totalQty} 件`);
    setSubmitResult({ batchId: data.batchId, totalItems, totalQty });
    setSubmitting(false);
  };

  const handleContinue = () => {
    setSubmitResult(null);
    setRows([{ ...emptyRow }]);
    window.scrollTo(0, 0);
  };

  const handleDeleteRow = (i: number) => {
    if (rows.length <= 1) setRows([{ ...emptyRow }]);
    else removeRow(i);
  };

  // ── Success view ──
  if (submitResult) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center mt-16">
        <div className="text-6xl mb-4">{isIn ? "📥" : "📤"}</div>
        <h1 className="text-2xl font-bold mb-2">{title}成功</h1>
        <p className="text-muted-foreground mb-1">{submitResult.totalItems} 种物料，共 {submitResult.totalQty} 件</p>
        <p className="text-xs text-muted-foreground mb-8">批次: {submitResult.batchId}</p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => router.push("/transactions/history")}>
            查看出入库记录
          </Button>
          <Button onClick={handleContinue}>
            继续{title}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Breadcrumb items={[
        { label: "出入库记录", href: "/transactions/history" },
        { label: title },
      ]} />
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        <Badge variant={isIn ? "default" : "secondary"} className="text-sm">
          {isIn ? "库存增加" : "库存减少"}
        </Badge>
      </div>

      {submitError && (
        <div className="bg-destructive/10 text-destructive rounded-lg p-3 mb-4 text-sm">{submitError}</div>
      )}

      {/* Templates */}
      {templates.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-muted-foreground">模板:</span>
          {templates.map((tpl, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleLoadTemplate(tpl)}>
                {tpl.name}
              </Button>
              <button onClick={() => handleDeleteTemplate(idx)} className="text-muted-foreground hover:text-destructive text-xs">&times;</button>
            </div>
          ))}
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
              <div key={i} className="mb-3 pb-3 border-b last:border-0 last:mb-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    #{i + 1}{row.itemName && ` — ${row.itemName}`}
                  </span>
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteRow(i)}>
                    {rows.length <= 1 ? "清空" : "删除"}
                  </Button>
                </div>

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
                    {row.itemId && (
                      <div className="text-xs text-muted-foreground mr-2 shrink-0">
                        <span className={isOverStock ? "text-destructive font-medium" : ""}>库存 {row.currentStock}</span>
                        <span className="ml-1">{row.unit}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-0.5">
                      {QTY_PRESETS.filter((p) => p <= 20).map((p) => (
                        <Button key={p} variant="outline" size="sm" className="h-8 w-9 px-0 text-xs"
                          onClick={() => updateRow(i, "quantity", p)}>{p}</Button>
                      ))}
                    </div>
                    <Input type="number" min={1} value={row.quantity || ""}
                      onChange={(e) => updateRow(i, "quantity", parseInt(e.target.value) || 0)}
                      className={`w-20 ${isOverStock ? "border-destructive" : ""}`} />
                    {row.unit && <span className="text-sm text-muted-foreground shrink-0">{row.unit}</span>}
                  </div>
                </div>

                {isOverStock && (
                  <p className="text-xs text-destructive mb-2">
                    ⚠ 库存不足（{row.currentStock}），出库 {row.quantity} 将导致负库存
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Input value={row.reason} onChange={(e) => updateRow(i, "reason", e.target.value)}
                    placeholder={isIn ? "入库原因（可选）" : "用途（可选）"} className="text-sm h-8" />
                  <Input value={row.relatedPerson} onChange={(e) => updateRow(i, "relatedPerson", e.target.value)}
                    placeholder={isIn ? "采购/送货人（可选）" : "领用人（可选）"} className="text-sm h-8" />
                  <Input value={row.note} onChange={(e) => updateRow(i, "note", e.target.value)}
                    placeholder="备注（可选）" className="text-sm h-8" />
                </div>
              </div>
            );
          })}

          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={addRow}>+ 添加物料</Button>
            {validRows.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => { setTemplateName(""); setSaveTemplateOpen(true); }}>
                💾 保存为模板
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()}>取消</Button>
        <Button onClick={() => setConfirmOpen(true)} disabled={submitting || validRows.length === 0}>
          {submitting ? "提交中..." : `确认${title}`}
        </Button>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>确认{title}</DialogTitle></DialogHeader>
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
                    <Badge variant={isIn ? "default" : "secondary"} className="text-xs">{isIn ? "+" : "-"}{r.quantity}</Badge>
                  </span>
                  <span className={`col-span-2 text-right font-mono ${isOver ? "text-destructive font-bold" : ""}`}>{r.newStock}</span>
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
              <span>合计</span><span>{totalItems} 种，{totalQty} 件</span>
            </div>
            {hasOverStock && (
              <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                ⚠ 有 {overStockRows.length} 项物料库存不足，出库后将出现负库存。确定继续？
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>取消</Button>
            <Button onClick={handleSubmitConfirm} disabled={submitting}>确认{title}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save template dialog */}
      <Dialog open={saveTemplateOpen} onOpenChange={setSaveTemplateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>保存为模板</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              将当前 {validRows.length} 种物料保存为{title}模板，下次可一键加载。
            </p>
            <div>
              <label className="text-sm font-medium">模板名称</label>
              <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)}
                placeholder={`例如：常用${title}组合`} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveTemplateOpen(false)}>取消</Button>
            <Button onClick={handleSaveTemplate} disabled={!templateName.trim()}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
