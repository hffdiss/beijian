"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const baseNavItems = [
  { href: "/", label: "仪表盘", icon: "📦" },
  { href: "/projects", label: "项目管理", icon: "🏗️" },
  { href: "/machines", label: "机器管理", icon: "🖥️" },
  { href: "/parts", label: "部件管理", icon: "🔧" },
  { href: "/boms", label: "BOM管理", icon: "📋" },
  { href: "/items", label: "物料管理", icon: "📦" },
  { href: "/transactions/in", label: "入库", icon: "📥" },
  { href: "/transactions/out", label: "出库", icon: "📤" },
  { href: "/transactions/history", label: "出入库记录", icon: "🔄" },
  { href: "/stocktake", label: "盘点", icon: "📊" },
  { href: "/categories", label: "分类管理", icon: "🗂️" },
];

const bottomItems = [
  { href: "/import", label: "数据导入", icon: "📄" },
  { href: "/backups", label: "备份管理", icon: "💾" },
  { href: "/admin/users", label: "用户管理", icon: "👤" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [dark, setDark] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.user) setUser(data.user); })
      .catch(() => {});
    const saved = localStorage.getItem("beijian_theme");
    const isDark = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
    // Load collapsed state
    setCollapsed(localStorage.getItem("beijian_sidebar") === "collapsed");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("sidebar-collapsed", collapsed);
    localStorage.setItem("beijian_sidebar", collapsed ? "collapsed" : "expanded");
  }, [collapsed]);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("beijian_theme", next ? "dark" : "light");
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const navItems = baseNavItems;

  const NavLink = ({ item }: { item: typeof navItems[0] }) => {
    const isActive = pathname === item.href ||
      (item.href !== "/" && pathname.startsWith(item.href + "/")) ||
      (item.href !== "/" && pathname === item.href);
    return (
      <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
        title={collapsed ? item.label : undefined}>
        <Button variant={isActive ? "secondary" : "ghost"}
          className={`w-full ${collapsed ? "justify-center px-0" : "justify-start"}`}>
          <span className={collapsed ? "" : "mr-2"}>{item.icon}</span>
          {!collapsed && item.label}
        </Button>
      </Link>
    );
  };

  const BottomLink = ({ item }: { item: typeof bottomItems[0] }) => (
    <Link href={item.href} className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted ${collapsed ? "justify-center px-2" : ""}`}
      title={collapsed ? item.label : undefined}>
      <span>{item.icon}</span>
      {!collapsed && item.label}
    </Link>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 bg-background border-r transition-all duration-200 ${collapsed ? "md:w-14" : "md:w-56"}`}>
        {/* Header */}
        <div className={`border-b flex items-center ${collapsed ? "p-2 justify-center" : "p-4 justify-between"}`}>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold">备品备件</h1>
              <p className="text-xs text-muted-foreground">管理系统</p>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title={collapsed ? "展开菜单" : "收起菜单"}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
              {collapsed ? (
                <path d="M6 4.5L11 9L6 13.5" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M11 4.5L6 9L11 13.5" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {navItems.map((item) => <NavLink key={item.href} item={item} />)}
        </div>

        {/* Bottom */}
        <div className="border-t p-2 space-y-0.5">
          <button onClick={toggleDark}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted w-full text-left ${collapsed ? "justify-center px-2" : ""}`}
            title={collapsed ? (dark ? "亮色模式" : "暗色模式") : undefined}>
            <span>{dark ? "☀️" : "🌙"}</span>
            {!collapsed && (dark ? "亮色模式" : "暗色模式")}
          </button>
          <a href="/api/items/export"
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted ${collapsed ? "justify-center px-2" : ""}`}
            title={collapsed ? "导出 CSV" : undefined}>
            <span>📥</span>
            {!collapsed && "导出 CSV"}
          </a>
          {bottomItems.map((item) => <BottomLink key={item.href} item={item} />)}
        </div>

        {/* User */}
        {user && (
          <div className={`border-t ${collapsed ? "p-2" : "p-3"}`}>
            <div className={`flex items-center ${collapsed ? "justify-center flex-col gap-1" : "justify-between px-3 py-2"}`}>
              {collapsed ? (
                <>
                  <span className="text-sm">👤</span>
                  <button onClick={handleLogout} className="text-[10px] text-muted-foreground hover:text-destructive">退出</button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <span>👤</span>
                    <span className="font-medium">{user.username}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs">退出</Button>
                </>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50">
        <div className="flex justify-around py-2">
          {navItems.slice(0, 5).map((item) => (
            <Link key={item.href} href={item.href} className="flex flex-col items-center text-xs">
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] text-muted-foreground">{item.label}</span>
            </Link>
          ))}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={
              <button className="flex flex-col items-center text-xs">
                <span className="text-lg">☰</span>
                <span className="text-[10px] text-muted-foreground">更多</span>
              </button>
            } />
            <SheetContent side="left" className="w-56 p-3">
              <div className="p-4 border-b mb-3">
                <h1 className="text-lg font-bold">备品备件</h1>
                <p className="text-xs text-muted-foreground">管理系统</p>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => <NavLink key={item.href} item={item} />)}
              </nav>
              <div className="border-t mt-3 pt-3 space-y-1">
                <button onClick={toggleDark} className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted w-full text-left">
                  <span>{dark ? "☀️" : "🌙"}</span> {dark ? "亮色模式" : "暗色模式"}
                </button>
                <Link href="/import" className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted"><span>📄</span> 数据导入</Link>
                <Link href="/backups" className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted"><span>💾</span> 备份管理</Link>
                <a href="/api/items/export" className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted"><span>📥</span> 导出 CSV</a>
                <Link href="/admin/users" className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted"><span>👤</span> 用户管理</Link>
              </div>
              {user && (
                <div className="border-t mt-3 pt-3">
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2 text-sm"><span>👤</span><span className="font-medium">{user.username}</span></div>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs">退出</Button>
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}
