#!/bin/bash
# 「言」部署脚本 - 部署到阿里云服务器 47.102.158.179
# 用法：SSH 登录服务器后执行此脚本

set -e

echo "========================================"
echo " 「言」部署到 www.kunshagj.com/yan/"
echo "========================================"

# 1. 创建目录结构
echo "[1/4] 创建目录..."
mkdir -p /var/www/html/yan/css
mkdir -p /var/www/html/yan/js
mkdir -p /var/www/html/yan/data

# 2. 写入 Nginx 配置
echo "[2/4] 配置 Nginx..."
cat > /etc/nginx/conf.d/yan.conf << 'NGINXEOF'
server {
    listen 80;
    server_name www.kunshagj.com kunshagj.com;

    root /var/www/html;
    index index.html;

    # 「言」子路径
    location /yan/ {
        alias /var/www/html/yan/;
        try_files $uri $uri/ /var/www/html/yan/index.html;
        index index.html;
    }

    # /yan 无斜杠自动跳转
    location = /yan {
        return 301 /yan/;
    }
}
NGINXEOF

# 3. 检查 Nginx 配置
echo "[3/4] 检查 Nginx 配置..."
nginx -t

# 4. 重载 Nginx
echo "[4/4] 重载 Nginx..."
nginx -s reload

echo ""
echo "========================================"
echo " Nginx 配置完成！"
echo " 接下来在本地 PowerShell 执行："
echo ""
echo " scp -r C:\Users\王坤\.openclaw\workspace\yan\css\* root@47.102.158.179:/var/www/html/yan/css/"
echo " scp -r C:\Users\王坤\.openclaw\workspace\yan\js\* root@47.102.158.179:/var/www/html/yan/js/"
echo " scp -r C:\Users\王坤\.openclaw\workspace\yan\data\* root@47.102.158.179:/var/www/html/yan/data/"
echo " scp C:\Users\王坤\.openclaw\workspace\yan\index.html root@47.102.158.179:/var/www/html/yan/"
echo " scp C:\Users\王坤\.openclaw\workspace\yan\favicon.svg root@47.102.158.179:/var/www/html/yan/"
echo " scp C:\Users\王坤\.openclaw\workspace\yan\og-image.png root@47.102.158.179:/var/www/html/yan/"
echo " scp C:\Users\王坤\.openclaw\workspace\yan\robots.txt root@47.102.158.179:/var/www/html/yan/"
echo "========================================"
