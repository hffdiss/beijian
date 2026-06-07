"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      if (!res.ok) { setError((await res.json()).error ?? "登录失败"); return; }
      const data = await res.json();
      router.push(data.passwordChanged ? redirect : "/admin/users");
    } catch { setError("网络错误"); } finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      if (!res.ok) { setError((await res.json()).error ?? "注册失败"); return; }
      router.push(redirect);
    } catch { setError("网络错误"); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-muted/50 to-background p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10"><span className="text-3xl">📦</span></div>
          <CardTitle className="text-xl">备品备件管理系统</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">请登录以继续</p>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs defaultValue="login">
            <TabsList className="w-full mb-5"><TabsTrigger value="login" className="flex-1">登录</TabsTrigger><TabsTrigger value="register" className="flex-1">注册</TabsTrigger></TabsList>
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5"><label className="text-sm font-medium">用户名</label><Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="请输入用户名" autoFocus required /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">密码</label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" required /></div>
                {error && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>}
                <Button type="submit" className="w-full" size="lg" disabled={loading || !username || !password}>{loading ? "登录中..." : "登录"}</Button>
              </form>
            </TabsContent>
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5"><label className="text-sm font-medium">用户名</label><Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="请设置用户名" required /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">密码</label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请设置密码（至少4位）" required /></div>
                {error && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>}
                <Button type="submit" className="w-full" size="lg" disabled={loading || !username || !password}>{loading ? "注册中..." : "注册并登录"}</Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
