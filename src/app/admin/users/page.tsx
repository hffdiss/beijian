"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Breadcrumb } from "@/components/breadcrumb";
import { useToast } from "@/components/toast";

interface User {
  id: string;
  username: string;
  role: string;
  passwordChanged: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Reset password dialog
  const [resetOpen, setResetOpen] = useState(false);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // New user dialog
  const [newOpen, setNewOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [newError, setNewError] = useState("");
  const [newLoading, setNewLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const [meRes, usersRes] = await Promise.all([
      fetch("/api/auth/me"),
      fetch("/api/admin/users"),
    ]);
    if (meRes.ok) setCurrentUser((await meRes.json()).user);
    if (usersRes.ok) setUsers(await usersRes.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRoleChange = async (userId: string, role: string) => {
    await fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    toast.success("角色已更新");
    load();
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`确定删除用户 "${user.username}"？此操作不可撤销。`)) return;
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    if (!res.ok) { const data = await res.json(); toast.error(data.error); return; }
    toast.success(`已删除"${user.username}"`);
    load();
  };

  const handleResetPassword = async () => {
    if (!resetUser) return;
    setResetError("");
    setResetLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${resetUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) { setResetError((await res.json()).error ?? "重置失败"); return; }
      toast.success(`已重置"${resetUser.username}"的密码`);
      setResetOpen(false);
      setNewPassword("");
      setResetUser(null);
      load();
    } catch { setResetError("网络错误"); }
    finally { setResetLoading(false); }
  };

  const handleCreateUser = async () => {
    if (!newUsername.trim() || !newPassword2) return;
    setNewError("");
    setNewLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername.trim(), password: newPassword2 }),
      });
      if (!res.ok) { setNewError((await res.json()).error ?? "创建失败"); return; }
      // Set role
      const userData = await res.json();
      if (newRole !== "user") {
        await fetch(`/api/admin/users/${userData.user.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        });
      }
      toast.success(`用户"${newUsername.trim()}"已创建`);
      setNewOpen(false);
      setNewUsername("");
      setNewPassword2("");
      setNewRole("user");
      load();
    } catch { setNewError("网络错误"); }
    finally { setNewLoading(false); }
  };

  // Filter
  const filtered = users.filter((u) => {
    if (search && !u.username.toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter && u.role !== roleFilter) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Breadcrumb items={[{ label: "用户管理" }]} />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">用户管理</h1>
        <Button onClick={() => { setNewOpen(true); setNewError(""); }}>新增用户</Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        <Input placeholder="搜索用户名..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-[200px] text-sm h-8" />
        <Select value={roleFilter || "null"} onValueChange={(v) => setRoleFilter(!v || v === "null" ? "" : v)}>
          <SelectTrigger className="w-28 h-8 text-sm"><SelectValue placeholder="角色" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="null">全部</SelectItem>
            <SelectItem value="admin">管理员</SelectItem>
            <SelectItem value="user">普通用户</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="h-8" onClick={() => { setSearch(""); setRoleFilter(""); }}>清除</Button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-12 bg-muted rounded" />))}
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">所有用户 ({filtered.length}{filtered.length !== users.length ? ` / ${users.length}` : ""})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户名</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>密码状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.username}
                      {u.id === currentUser?.id && <Badge variant="outline" className="ml-2 text-xs">我</Badge>}
                    </TableCell>
                    <TableCell>
                      <Select value={u.role} onValueChange={(v) => handleRoleChange(u.id, v)}>
                        <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">管理员</SelectItem>
                          <SelectItem value="user">普通用户</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.passwordChanged ? "secondary" : "destructive"}>
                        {u.passwordChanged ? "已修改" : "默认密码"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString("zh-CN")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => { setResetUser(u); setNewPassword(""); setResetError(""); setResetOpen(true); }}>
                          重置密码
                        </Button>
                        <Button variant="destructive" size="sm" disabled={u.id === currentUser?.id} onClick={() => handleDelete(u)}>
                          删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-8">无匹配用户</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reset password dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>重置密码 — {resetUser?.username}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">新密码</label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="至少4位" />
            </div>
            {resetError && <p className="text-sm text-destructive">{resetError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>取消</Button>
            <Button onClick={handleResetPassword} disabled={newPassword.length < 4 || resetLoading}>
              {resetLoading ? "重置中..." : "确认重置"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New user dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>新增用户</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">用户名</label>
              <Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="输入用户名" />
            </div>
            <div>
              <label className="text-sm font-medium">密码</label>
              <Input type="password" value={newPassword2} onChange={(e) => setNewPassword2(e.target.value)} placeholder="至少4位" />
            </div>
            <div>
              <label className="text-sm font-medium">角色</label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">普通用户</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newError && <p className="text-sm text-destructive">{newError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>取消</Button>
            <Button onClick={handleCreateUser} disabled={!newUsername.trim() || newPassword2.length < 4 || newLoading}>
              {newLoading ? "创建中..." : "创建用户"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
