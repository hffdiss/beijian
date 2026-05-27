"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { href: "/", label: "仪表盘", icon: "📦" },
  { href: "/projects", label: "项目管理", icon: "🏗️" },
  { href: "/parts", label: "部件管理", icon: "🔧" },
  { href: "/boms", label: "BOM管理", icon: "📋" },
  { href: "/items", label: "物料管理", icon: "📦" },
  { href: "/transactions/in", label: "入库", icon: "📥" },
  { href: "/transactions/out", label: "出库", icon: "📤" },
  { href: "/transactions/history", label: "出入库记录", icon: "🔄" },
  { href: "/stocktake", label: "盘点", icon: "📊" },
  { href: "/categories", label: "分类管理", icon: "⚙️" },
  { href: "/import", label: "数据导入", icon: "📄" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const NavLinks = () => (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
            <Button
              variant={isActive ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </Button>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* 桌面端侧边栏 */}
      <aside className="hidden md:flex md:flex-col md:w-56 md:fixed md:inset-y-0 bg-background border-r">
        <div className="p-4 border-b">
          <h1 className="text-lg font-bold">备品备件</h1>
          <p className="text-xs text-muted-foreground">管理系统</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NavLinks />
        </div>
        <div className="border-t p-3 space-y-1">
          <a href="/api/backup" className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted">
            <span>💾</span> 备份数据库
          </a>
          <a href="/api/items/export" className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted">
            <span>📄</span> 导出 CSV
          </a>
        </div>
      </aside>

      {/* 手机端底部导航 + 抽屉 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50">
        <div className="flex justify-around py-2">
          {navItems.slice(0, 5).map((item) => (
            <Link key={item.href} href={item.href} className="flex flex-col items-center text-xs">
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] text-muted-foreground">{item.label}</span>
            </Link>
          ))}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <button className="flex flex-col items-center text-xs">
                  <span className="text-lg">☰</span>
                  <span className="text-[10px] text-muted-foreground">更多</span>
                </button>
              }
            />
            <SheetContent side="left" className="w-56 p-3">
              <div className="p-4 border-b mb-3">
                <h1 className="text-lg font-bold">备品备件</h1>
                <p className="text-xs text-muted-foreground">管理系统</p>
              </div>
              <NavLinks />
              <div className="border-t mt-3 pt-3 space-y-1">
                <a href="/api/backup" className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted">
                  <span>💾</span> 备份数据库
                </a>
                <a href="/api/items/export" className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted">
                  <span>📄</span> 导出 CSV
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}
