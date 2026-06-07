// PM2 配置文件
// 用法: pm2 start ecosystem.config.js

module.exports = {
  apps: [{
    name: "beijian",
    script: "node_modules/.bin/next",
    args: "start",
    cwd: "/opt/beijian",
    instances: 1,
    exec_mode: "fork",
    env: {
      NODE_ENV: "production",
      PORT: 3000,
    },
    // 自动重启
    autorestart: true,
    watch: false,
    max_memory_restart: "512M",
    // 日志
    error_file: "/var/log/beijian/error.log",
    out_file: "/var/log/beijian/output.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss",
  }],
};
