"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
}

export function ItemSelector({ value, onChange, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ItemOption[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [selectedName, setSelectedName] = useState("");

  const loadItems = async (q: string) => {
    const res = await fetch(`/api/items?q=${encodeURIComponent(q)}&limit=20`);
    setItems(await res.json());
  };

  useEffect(() => { loadItems(search); }, [search]);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, []);

  const handleSelect = (item: ItemOption) => {
    onChange(item);
    setSelectedName(item.name);
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button variant="outline" className="w-full justify-start">
              {selectedName || placeholder || "搜索物料..."}
            </Button>
          }
        />
        <PopoverContent className="w-[400px] p-0" align="start">
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
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    onSelect={() => handleSelect(item)}
                    className="flex justify-between"
                  >
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground ml-2 text-sm">
                        {item.code}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {item.quantity} {item.unit}
                    </span>
                  </CommandItem>
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
