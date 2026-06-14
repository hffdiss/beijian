# 备品备件管理系统

## 本地开发

```bash
# 安装依赖
npm install

# 生成 Prisma client
npx prisma generate

# 初始化数据库
npx prisma db push

# 创建默认管理员账户 (admin / admin123)
npx tsx prisma/seed.ts

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000，默认管理员账号 `admin` / `admin123`。

## Docker 部署

### 首次部署

```bash
# 生成随机 JWT 密钥
echo "JWT_SECRET=$(openssl rand -hex 32)" > .env

# 构建并启动
docker compose up -d --build

# 查看日志
docker compose logs -f
```

### 后续更新

```bash
git pull
docker compose up -d --build
```

### 数据持久化

- SQLite 数据库文件保存在 `./data/dev.db`
- 备份目录 `./data/backups/`

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `JWT_SECRET` | JWT 签名密钥 | `change-this-to-a-random-secret` |
| `DATABASE_URL` | 数据库路径 | `file:./data/dev.db` |

数据库初始化（建表 + 种子数据）在容器启动时自动执行，无需手动操作。
