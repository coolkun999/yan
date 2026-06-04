@echo off
chcp 65001 >nul
echo ========================================
echo  「言」恢复为根路径部署（独立域名用）
echo  例如：www.yan.com
echo ========================================
echo.

set "SRC=%~dp0backup-root"
set "DST=%~dp0.."

echo 正在恢复文件...

copy /Y "%SRC%\index.html" "%DST%\index.html"
copy /Y "%SRC%\app.js" "%DST%\js\app.js"
copy /Y "%SRC%\auth.js" "%DST%\js\auth.js"
copy /Y "%SRC%\db.js" "%DST%\data\db.js"

echo.
echo ========================================
echo  恢复完成！
echo  注意：还需要手动修改以下内容：
echo  1. index.html 中的 og:url 改为新域名
echo  2. index.html 中的 og:image 改为新域名
echo  3. app.js 中的分享链接改为新域名
echo  4. 添加 CNAME 文件（如用 GitHub Pages）
echo ========================================
pause
