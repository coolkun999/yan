#!/bin/bash
# 「言」项目 - 服务器文件上传脚本 (Git Bash 版本)
# 用法: bash deploy-upload.sh

SERVER="root@47.102.158.179"
REMOTE_PATH="/var/www/html/yan"
LOCAL_PATH="/c/Users/王坤/.openclaw/workspace/yan"

echo -e "\033[36m=== 「言」项目 - 上传修复后的文件到服务器 ===\033[0m"
echo ""
echo -e "\033[33m将上传以下文件:\033[0m"
echo "  1. index.html -> ${REMOTE_PATH}/index.html"
echo "  2. robots.txt -> ${REMOTE_PATH}/robots.txt"
echo "  3. js/app.js -> ${REMOTE_PATH}/js/app.js"
echo ""
echo -e "\033[32m服务器: $SERVER\033[0m"
echo ""

echo -e "\033[36m正在上传 index.html...\033[0m"
scp "${LOCAL_PATH}/index.html" "${SERVER}:${REMOTE_PATH}/index.html" && echo -e "  \033[32m✓ index.html 上传成功\033[0m" || { echo -e "  \033[31m✗ index.html 上传失败\033[0m"; exit 1; }

echo -e "\033[36m正在上传 robots.txt...\033[0m"
scp "${LOCAL_PATH}/robots.txt" "${SERVER}:${REMOTE_PATH}/robots.txt" && echo -e "  \033[32m✓ robots.txt 上传成功\033[0m" || { echo -e "  \033[31m✗ robots.txt 上传失败\033[0m"; exit 1; }

echo -e "\033[36m正在上传 js/app.js...\033[0m"
scp "${LOCAL_PATH}/js/app.js" "${SERVER}:${REMOTE_PATH}/js/app.js" && echo -e "  \033[32m✓ js/app.js 上传成功\033[0m" || { echo -e "  \033[31m✗ js/app.js 上传失败\033[0m"; exit 1; }

echo ""
echo -e "\033[32m=== 上传完成！===\033[0m"
echo -e "\033[33m请访问 https://www.kunshagj.com/yan/ 验证更新\033[0m"
