"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command, CommandEmpty, CommandGroup, CommandItem, CommandInput, CommandList,
} from "@/components/ui/command";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { ItemFormDialog } from "./item-form-dialog";

interface ItemOption {
  id: string;
  code: string;
  name: string;
  unit: string;
  quantity: number;
  safetyStock: number;
  categoryId?: string;
}

interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

interface Props {
  value: string;
  onChange: (item: ItemOption) => void;
  placeholder?: string;
  transactionType?: "IN" | "OUT";
}

const RECENT_ITEMS_KEY = "beijian_recent_items";

function getRecentIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_ITEMS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function addRecentId(id: string) {
  const ids = getRecentIds().filter((i) => i !== id);
  ids.unshift(id);
  localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(ids.slice(0, 10)));
}

export function ItemSelector({ value, onChange, placeholder, transactionType }: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ItemOption[]>([]);
  const [recentItems, setRecentItems] = useState<ItemOption[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const [selectedStock, setSelectedStock] = useState<number | null>(null);

  const loadItems = async (q: string) => {
    const res = await fetch(`/api/items?q=${encodeURIComponent(q)}&limit=20`);
    setItems(await res.json());
  };

  useEffect(() => {
    if (search) {
      loadItems(search);
    } else if (open) {
      // Show recent items when opening without search
      const recentIds = getRecentIds();
      if (recentIds.length > 0) {
        fetch(`/api/items?limit=20`)
          .then((r) => r.json())
          .then((all: ItemOption[]) => {
            const ordered = recentIds
              .map((id) => all.find((i) => i.id === id))
              .filter(Boolean) as ItemOption[];
            setRecentItems(ordered);
          });
      }
      loadItems("");
    }
  }, [search, open]);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, []);

  const handleSelect = (item: ItemOption) => {
    onChange(item);
    setSelectedName(`${item.name} (${item.code})`);
    setSelectedStock(item.quantity);
    addRecentId(item.id);
    setOpen(false);
  };

  const displayItems = search ? items : (recentItems.length > 0 ? recentItems : items);
  const showRecent = !search && recentItems.length > 0;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button variant="outline" className="w-full justify-between">
              <span className={selectedName ? "" : "text-muted-foreground"}>
                {selectedName || placeholder || "搜索物料..."}
              </span>
              {selectedStock != null && (
                <Badge variant={selectedStock <= 0 && transactionType === "OUT" ? "destructive" : "secondary"} className="ml-2 text-xs shrink-0">
                  库存 {selectedStock}
                </Badge>
              )}
            </Button>
          }
        />
        <PopoverContent className="w-[420px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="输入名称/编号搜索..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                <div className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">未找到物料</p>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => { setQuickCreateOpen(true); setOpen(false); }}
                  >
                    快速新建物料
                  </Button>
                </div>
              </CommandEmpty>
              {showRecent && (
                <CommandGroup heading="最近使用">
                  {recentItems.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onSelect={handleSelect}
                      transactionType={transactionType}
                    />
                  ))}
                </CommandGroup>
              )}
              <CommandGroup heading={showRecent ? "全部物料" : undefined}>
                {(showRecent ? items : displayItems).map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onSelect={handleSelect}
                    transactionType={transactionType}
                  />
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <ItemFormDialog
        open={quickCreateOpen}
        onOpenChange={setQuickCreateOpen}
        item={{ code: "", name: search, categoryId: "", unit: "个" }}
        categories={categories}
        onSaved={() => {
          loadItems(search);
          setQuickCreateOpen(false);
        }}
      />
    </>
  );
}

function ItemRow({
  item, onSelect, transactionType,
}: {
  item: ItemOption; onSelect: (item: ItemOption) => void; transactionType?: "IN" | "OUT";
}) {
  const lowStock = item.quantity <= item.safetyStock && item.safetyStock > 0;
  const outOfStock = transactionType === "OUT" && item.quantity <= 0;

  return (
    <CommandItem
      onSelect={() => onSelect(item)}
      className="flex justify-between"
      disabled={outOfStock}
    >
      <div className="flex-1 min-w-0">
        <span className="font-medium">{item.name}</span>
        <span className="text-muted-foreground ml-2 text-xs">{item.code}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {outOfStock ? (
          <Badge variant="destructive" className="text-xs">无库存</Badge>
        ) : lowStock && transactionType === "OUT" ? (
          <Badge variant="destructive" className="text-xs">{item.quantity} {item.unit}</Badge>
        ) : (
          <span className={`text-xs ${transactionType === "OUT" ? "text-muted-foreground" : "text-green-600"}`}>
            {item.quantity} {item.unit}
          </span>
        )}
      </div>
    </CommandItem>
  );
}
