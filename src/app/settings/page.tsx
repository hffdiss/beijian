"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/breadcrumb";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  // Profile form
  const [username, setUsername] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          setUsername(data.user.username);
        }
      });
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwError(data.error ?? "修改失败");
        return;
      }
      setPwSuccess("密码修改成功");
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      setPwError("网络错误");
    } finally {
      setPwLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    setProfileLoading(true);
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileError(data.error ?? "修改失败");
        return;
      }
      setUser(data.user);
      setProfileSuccess("用户名修改成功");
      router.refresh();
    } catch {
      setProfileError("网络错误");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangeRole = async (newRole: string) => {
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setUser(data.user);
    } catch { /* ignore */ }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <Breadcrumb items={[{ label: "用户设置" }]} />
      <h1 className="text-2xl font-bold mb-6">用户设置</h1>

      <Tabs defaultValue="password">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="password" className="flex-1">修改密码</TabsTrigger>
          <TabsTrigger value="profile" className="flex-1">个人信息</TabsTrigger>
          {user?.role === "admin" && (
            <TabsTrigger value="admin" className="flex-1">用户管理</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">修改密码</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">当前密码</label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="输入当前密码"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">新密码</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="输入新密码（至少4位）"
                    required
                  />
                </div>
                {pwError && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{pwError}</p>}
                {pwSuccess && <p className="text-sm text-green-600 bg-green-50 rounded-md px-3 py-2">{pwSuccess}</p>}
                <Button type="submit" disabled={pwLoading || !currentPassword || !newPassword}>
                  {pwLoading ? "修改中..." : "修改密码"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">个人信息</CardTitle>
            </CardHeader>
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
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="输入新用户名"
                    required
                  />
                </div>
                {profileError && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{profileError}</p>}
                {profileSuccess && <p className="text-sm text-green-600 bg-green-50 rounded-md px-3 py-2">{profileSuccess}</p>}
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
              <CardHeader>
                <CardTitle className="text-lg">用户管理</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  管理员可以修改用户角色。当前角色修改仅对自身生效（演示用途）。
                </p>
                <div className="flex gap-3">
                  <Button
                    variant={user?.role === "admin" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleChangeRole("admin")}
                  >
                    管理员
                  </Button>
                  <Button
                    variant={user?.role === "user" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleChangeRole("user")}
                  >
                    普通用户
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
