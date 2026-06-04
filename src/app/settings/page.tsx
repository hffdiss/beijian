"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Breadcrumb } from "@/components/breadcrumb";
import { useToast } from "@/components/toast";

interface UserItem {
  id: string; username: string; role: string; passwordChanged: boolean; createdAt: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const toast = useToast();
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  // Profile
  const [username, setUsername] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  // Admin: user list
  const [users, setUsers] = useState<UserItem[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [resetUser, setResetUser] = useState<UserItem | null>(null);
  const [resetPw, setResetPw] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [newError, setNewError] = useState("");
  const [newLoading, setNewLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => (r.ok ? r.json() : null)).then((data) => {
      if (data?.user) { setUser(data.user); setUsername(data.user.username); }
    }).finally(() => setLoading(false));
  }, []);

  // ── Password ──
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error("两次输入的密码不一致"); return; }
    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
      if (!res.ok) { toast.error((await res.json()).error ?? "修改失败"); return; }
      toast.success("密码修改成功");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch { toast.error("网络错误"); }
    finally { setPwLoading(false); }
  };

  // ── Profile ──
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === user?.username) { toast.error("用户名未变更"); return; }
    setProfileLoading(true);
    try {
      const res = await fetch("/api/auth/update-profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: username.trim() }) });
      if (!res.ok) { toast.error((await res.json()).error ?? "修改失败"); return; }
      const data = await res.json();
      setUser(data.user);
      toast.success("用户名修改成功");
      router.refresh();
    } catch { toast.error("网络错误"); }
    finally { setProfileLoading(false); }
  };

  // ── Admin: load users ──
  const loadUsers = async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
  };

  const handleRoleChange = async (userId: string, role: string) => {
    await fetch(`/api/admin/users/${userId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
    toast.success("角色已更新");
    loadUsers();
  };

  const handleDelete = async (u: UserItem) => {
    if (!confirm(`确定删除 "${u.username}"？`)) return;
    const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
    if (!res.ok) { toast.error((await res.json()).error); return; }
    toast.success(`已删除"${u.username}"`);
    loadUsers();
  };

  const handleResetPassword = async () => {
    if (!resetUser) return;
    setResetError("");
    setResetLoading(true);
    const res = await fetch(`/api/admin/users/${resetUser.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: resetPw }) });
    if (!res.ok) { setResetError((await res.json()).error ?? "重置失败"); return; }
    toast.success(`已重置"${resetUser.username}"的密码`);
    setResetOpen(false); setResetPw(""); setResetUser(null);
    loadUsers();
    setResetLoading(false);
  };

  const handleCreateUser = async () => {
    if (!newUsername.trim() || !newPw) return;
    setNewError(""); setNewLoading(true);
    const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: newUsername.trim(), password: newPw }) });
    if (!res.ok) { setNewError((await res.json()).error ?? "创建失败"); setNewLoading(false); return; }
    const userData = await res.json();
    if (newRole !== "user") { await fetch(`/api/admin/users/${userData.user.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: newRole }) }); }
    toast.success(`用户"${newUsername.trim()}"已创建`);
    setNewOpen(false); setNewUsername(""); setNewPw(""); setNewRole("user");
    loadUsers();
    setNewLoading(false);
  };

  const filteredUsers = users.filter((u) => {
    if (userSearch && !u.username.toLowerCase().includes(userSearch.toLowerCase())) return false;
    if (roleFilter && u.role !== roleFilter) return false;
    return true;
  });

  if (loading) {
    return <div className="p-6 max-w-xl mx-auto animate-pulse"><div className="h-8 bg-muted rounded w-1/3 mb-6" /><div className="h-10 bg-muted rounded w-full mb-6" /><div className="h-48 bg-muted rounded" /></div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Breadcrumb items={[{ label: "用户设置" }]} />
      <h1 className="text-2xl font-bold mb-6">用户设置</h1>

      <Tabs defaultValue="password">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="password" className="flex-1">修改密码</TabsTrigger>
          <TabsTrigger value="profile" className="flex-1">个人信息</TabsTrigger>
          {user?.role === "admin" && <TabsTrigger value="admin" className="flex-1">用户管理</TabsTrigger>}
        </TabsList>

        <TabsContent value="password">
          <Card>
            <CardHeader><CardTitle className="text-lg">修改密码</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1.5"><label className="text-sm font-medium">当前密码</label><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="输入当前密码" required /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">新密码</label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="至少4位" required /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">确认新密码</label><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="再次输入" required className={confirmPassword && newPassword !== confirmPassword ? "border-destructive" : ""} />
                  {confirmPassword && newPassword !== confirmPassword && <p className="text-xs text-destructive">两次密码不一致</p>}
                </div>
                <Button type="submit" disabled={pwLoading || !currentPassword || !newPassword || !confirmPassword}>{pwLoading ? "修改中..." : "修改密码"}</Button>
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
                <Badge variant={user?.role === "admin" ? "default" : "secondary"}>{user?.role === "admin" ? "管理员" : "普通用户"}</Badge>
              </div>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-1.5"><label className="text-sm font-medium">用户名</label><Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="输入新用户名" required /></div>
                <Button type="submit" disabled={profileLoading || !username.trim()}>{profileLoading ? "保存中..." : "保存修改"}</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {user?.role === "admin" && (
          <TabsContent value="admin">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">用户管理</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-3">
                  <Button size="sm" onClick={() => { setNewOpen(true); setNewError(""); }}>新增用户</Button>
                  <Input placeholder="搜索..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="w-32 h-8 text-sm" />
                  <Select value={roleFilter || "null"} onValueChange={(v) => setRoleFilter(!v || v === "null" ? "" : v)}>
                    <SelectTrigger className="w-24 h-8 text-sm"><SelectValue placeholder="角色" /></SelectTrigger>
                    <SelectContent><SelectItem value="null">全部</SelectItem><SelectItem value="admin">管理员</SelectItem><SelectItem value="user">普通用户</SelectItem></SelectContent>
                  </Select>
                </div>
                <Table>
                  <TableHeader><TableRow><TableHead>用户名</TableHead><TableHead>角色</TableHead><TableHead>密码</TableHead><TableHead>创建</TableHead><TableHead>操作</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.username}{u.username === user.username && <Badge variant="outline" className="ml-2 text-xs">我</Badge>}</TableCell>
                        <TableCell><Select value={u.role} onValueChange={(v) => handleRoleChange(u.id, v)}><SelectTrigger className="w-24 h-7 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">管理员</SelectItem><SelectItem value="user">普通用户</SelectItem></SelectContent></Select></TableCell>
                        <TableCell><Badge variant={u.passwordChanged ? "secondary" : "destructive"}>{u.passwordChanged ? "已改" : "默认"}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString("zh-CN")}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setResetUser(u); setResetPw(""); setResetError(""); setResetOpen(true); }}>重置</Button>
                            <Button variant="ghost" size="sm" disabled={u.username === user.username} onClick={() => handleDelete(u)}>删除</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Reset pw dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent><DialogHeader><DialogTitle>重置密码 — {resetUser?.username}</DialogTitle></DialogHeader>
          <div><label className="text-sm font-medium">新密码</label><Input type="password" value={resetPw} onChange={(e) => setResetPw(e.target.value)} placeholder="至少4位" /></div>
          {resetError && <p className="text-sm text-destructive">{resetError}</p>}
          <DialogFooter><Button variant="outline" onClick={() => setResetOpen(false)}>取消</Button><Button onClick={handleResetPassword} disabled={resetPw.length < 4 || resetLoading}>确认</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New user dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent><DialogHeader><DialogTitle>新增用户</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium">用户名</label><Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="用户名" /></div>
            <div><label className="text-sm font-medium">密码</label><Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="至少4位" /></div>
            <div><label className="text-sm font-medium">角色</label><Select value={newRole} onValueChange={setNewRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="user">普通用户</SelectItem><SelectItem value="admin">管理员</SelectItem></SelectContent></Select></div>
            {newError && <p className="text-sm text-destructive">{newError}</p>}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setNewOpen(false)}>取消</Button><Button onClick={handleCreateUser} disabled={!newUsername.trim() || newPw.length < 4 || newLoading}>{newLoading ? "创建中..." : "创建"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
