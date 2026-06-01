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

interface User {
  id: string;
  username: string;
  role: string;
  passwordChanged: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  // Reset password dialog
  const [resetOpen, setResetOpen] = useState(false);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const load = async () => {
    const [meRes, usersRes] = await Promise.all([
      fetch("/api/auth/me"),
      fetch("/api/admin/users"),
    ]);
    if (meRes.ok) {
      const meData = await meRes.json();
      setCurrentUser(meData.user);
    }
    if (usersRes.ok) {
      setUsers(await usersRes.json());
    } else {
      setError("无权限访问");
    }
  };

  useEffect(() => { load(); }, []);

  const handleRoleChange = async (userId: string, role: string) => {
    await fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    load();
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`确定删除用户 "${user.username}"？此操作不可撤销。`)) return;
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error);
      return;
    }
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
      if (!res.ok) {
        const data = await res.json();
        setResetError(data.error ?? "重置失败");
        return;
      }
      setResetOpen(false);
      setNewPassword("");
      setResetUser(null);
      load();
    } catch {
      setResetError("网络错误");
    } finally {
      setResetLoading(false);
    }
  };

  if (error) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center">
        <p className="text-destructive mb-4">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">用户管理</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">所有用户 ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
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
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.username}
                    {u.id === currentUser?.id && (
                      <Badge variant="outline" className="ml-2 text-xs">我</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={u.role}
                      onValueChange={(v) => handleRoleChange(u.id, v)}
                    >
                      <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
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
                    <div className="flex gap-2">
                      <Button
                        variant="outline" size="sm"
                        onClick={() => { setResetUser(u); setNewPassword(""); setResetError(""); setResetOpen(true); }}
                      >
                        重置密码
                      </Button>
                      <Button
                        variant="destructive" size="sm"
                        disabled={u.id === currentUser?.id}
                        onClick={() => handleDelete(u)}
                      >
                        删除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重置密码 — {resetUser?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">新密码</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="输入新密码（至少4位）"
              />
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
    </div>
  );
}
