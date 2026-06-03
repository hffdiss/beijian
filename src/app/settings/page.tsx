"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/breadcrumb";
import { useToast } from "@/components/toast";

export default function SettingsPage() {
  const router = useRouter();
  const toast = useToast();
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  // Profile form
  const [username, setUsername] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          setUsername(data.user.username);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error("两次输入的密码不一致"); return; }
    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) { const data = await res.json(); toast.error(data.error ?? "修改失败"); return; }
      toast.success("密码修改成功");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch { toast.error("网络错误"); }
    finally { setPwLoading(false); }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === user?.username) { toast.error("用户名未变更"); return; }
    setProfileLoading(true);
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      if (!res.ok) { const data = await res.json(); toast.error(data.error ?? "修改失败"); return; }
      const data = await res.json();
      setUser(data.user);
      toast.success("用户名修改成功");
      router.refresh();
    } catch { toast.error("网络错误"); }
    finally { setProfileLoading(false); }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-xl mx-auto animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3 mb-6" />
        <div className="h-10 bg-muted rounded w-full mb-6" />
        <div className="h-48 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <Breadcrumb items={[{ label: "用户设置" }]} />
      <h1 className="text-2xl font-bold mb-6">用户设置</h1>

      <Tabs defaultValue="password">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="password" className="flex-1">修改密码</TabsTrigger>
          <TabsTrigger value="profile" className="flex-1">个人信息</TabsTrigger>
          {user?.role === "admin" && (
            <TabsTrigger value="admin" className="flex-1">管理</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="password">
          <Card>
            <CardHeader><CardTitle className="text-lg">修改密码</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">当前密码</label>
                  <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="输入当前密码" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">新密码</label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="至少4位" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">确认新密码</label>
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="再次输入新密码" required
                    className={confirmPassword && newPassword !== confirmPassword ? "border-destructive" : ""} />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-destructive">两次密码不一致</p>
                  )}
                </div>
                <Button type="submit" disabled={pwLoading || !currentPassword || !newPassword || !confirmPassword}>
                  {pwLoading ? "修改中..." : "修改密码"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader><CardTitle className="text-lg">个人信息</CardTitle></CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">当前角色:</span>
                <Badge variant={user?.role === "admin" ? "default" : "secondary"}>
                  {user?.role === "admin" ? "管理员" : "普通用户"}
                </Badge>
              </div>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">用户名</label>
                  <Input value={username} onChange={(e) => setUsername(e.target.value)}
                    placeholder="输入新用户名" required />
                </div>
                <Button type="submit" disabled={profileLoading || !username.trim()}>
                  {profileLoading ? "保存中..." : "保存修改"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {user?.role === "admin" && (
          <TabsContent value="admin">
            <Card>
              <CardHeader><CardTitle className="text-lg">用户管理</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  管理所有用户、重置密码、分配角色。
                </p>
                <Link href="/admin/users">
                  <Button>👥 打开用户管理</Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
