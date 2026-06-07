#!/bin/bash
# 备品备件管理系统 — 部署脚本
# 用法: chmod +x deploy.sh && ./deploy.sh

set -e

APP_DIR="/opt/beijian"
NODE_VERSION="22"

echo "=== 备品备件管理系统 部署 ==="

# 1. 安装 Node.js (如未安装)
if ! command -v node &>/dev/null; then
  echo "安装 Node.js $NODE_VERSION..."
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
  apt-get install -y nodejs
fi

# 2. 创建应用目录
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# 3. 复制项目文件 (从当前目录或 Git)
if [ -f "./package.json" ]; then
  # 本地部署
  cp -r ./* "$APP_DIR/"
else
  # 从 Git 克隆
  git clone https://github.com/hffdiss/beijian.git .
fi

# 4. 安装依赖
npm install --production=false
npx prisma generate

# 5. 构建
npm run build

# 6. 配置环境变量
if [ ! -f ".env" ]; then
  JWT_SECRET=$(openssl rand -hex 32)
  cat > .env << EOF
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="$JWT_SECRET"
EOF
  echo "已生成 .env (JWT_SECRET=$JWT_SECRET)"
fi

# 7. 初始化数据库 + 种子
npx prisma db push
npx tsx prisma/seed.ts || true

echo ""
echo "=== 部署完成 ==="
echo "启动方式："
echo "  直接: cd $APP_DIR && npm start"
echo "  PM2:  cd $APP_DIR && pm2 start npm --name beijian -- start"
echo "  访问: http://$(hostname -I | awk '{print $1}'):3000"
