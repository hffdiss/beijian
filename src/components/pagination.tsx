"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PAGE_SIZES = [10, 20, 50];

interface Props {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function Pagination({ page, totalPages, total, limit, onPageChange, onLimitChange }: Props) {
  const [jumpInput, setJumpInput] = useState("");

  const handleJump = () => {
    const n = parseInt(jumpInput);
    if (n >= 1 && n <= totalPages) {
      onPageChange(n);
      setJumpInput("");
    }
  };

  return (
    <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>每页</span>
        <Select value={String(limit)} onValueChange={(v) => { onLimitChange(Number(v)); onPageChange(1); }}>
          <SelectTrigger className="w-16 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((s) => (
              <SelectItem key={s} value={String(s)}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>行 · 共 {total} 条</span>
      </div>

      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(1)}>
          &laquo;
        </Button>
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          上一页
        </Button>

        <span className="text-sm text-muted-foreground mx-1 whitespace-nowrap">
          {page} / {totalPages || 1}
        </span>

        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          下一页
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(totalPages)}>
          &raquo;
        </Button>

        <form
          onSubmit={(e) => { e.preventDefault(); handleJump(); }}
          className="flex items-center gap-1 ml-2"
        >
          <Input
            type="number"
            min={1}
            max={totalPages}
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            placeholder="页"
            className="w-14 h-8 text-xs text-center"
          />
          <Button type="submit" variant="outline" size="sm" className="h-8 text-xs" disabled={!jumpInput}>
            跳转
          </Button>
        </form>
      </div>
    </div>
  );
}
