"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const check = () => {
      setCollapsed(document.documentElement.classList.contains("sidebar-collapsed"));
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <main className={`pb-16 md:pb-0 transition-all duration-200 ${collapsed ? "md:pl-14" : "md:pl-56"}`}>
        {children}
      </main>
    </>
  );
}
