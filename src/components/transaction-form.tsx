"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ItemSelector } from "./item-selector";

interface Row {
  itemId: string;
  itemName: string;
  unit: string;
  quantity: number;
  reason: string;
  relatedPerson: string;
  note: string;
}

interface Props {
  type: "IN" | "OUT";
}

const emptyRow: Row = {
  itemId: "", itemName: "", unit: "", quantity: 1,
  reason: "", relatedPerson: "", note: "",
};

export function TransactionForm({ type }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([{ ...emptyRow }]);
  const [submitting, setSubmitting] = useState(false);

  const title = type === "IN" ? "入库" : "出库";

  const addRow = () => {
    setRows([...rows, { ...emptyRow }]);
  };

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

  const handleSubmit = async () => {
    const valid = rows.filter((r) => r.itemId && r.quantity > 0);
    if (valid.length === 0) return;

    setSubmitting(true);
    const body = {
      type,
      items: valid.map((r) => ({
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
      alert(err.error);
      setSubmitting(false);
      return;
    }

    router.push("/transactions/history");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{title}</h1>

      <Card className="mb-4">
        <CardContent className="p-4">
          {rows.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-3 pb-3 border-b last:border-0"
            >
              <div className="md:col-span-3">
                <label className="text-xs font-medium">物料</label>
                <ItemSelector
                  value={row.itemId}
                  onChange={(item) => {
                    updateRow(i, "itemId", item.id);
                    updateRow(i, "itemName", item.name);
                    updateRow(i, "unit", item.unit);
                  }}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium">数量</label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={1}
                    value={row.quantity}
                    onChange={(e) => updateRow(i, "quantity", parseInt(e.target.value) || 0)}
                  />
                  <span className="text-sm text-muted-foreground shrink-0">{row.unit}</span>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium">领用人</label>
                <Input
                  value={row.relatedPerson}
                  onChange={(e) => updateRow(i, "relatedPerson", e.target.value)}
                  placeholder="可选"
                />
              </div>
              <div className="md:col-span-3">
                <label className="text-xs font-medium">用途</label>
                <Input
                  value={row.reason}
                  onChange={(e) => updateRow(i, "reason", e.target.value)}
                  placeholder="可选"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-xs font-medium">备注</label>
                <Input
                  value={row.note}
                  onChange={(e) => updateRow(i, "note", e.target.value)}
                  placeholder="可选"
                />
              </div>
              <div className="md:col-span-1 flex items-end">
                <Button
                  variant="ghost" size="sm"
                  onClick={() => removeRow(i)}
                  disabled={rows.length === 1}
                >
                  删除
                </Button>
              </div>
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={addRow} className="mt-2">
            + 添加物料
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()}>取消</Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || rows.every((r) => !r.itemId)}
        >
          {submitting ? "提交中..." : `确认${title}`}
        </Button>
      </div>
    </div>
  );
}
