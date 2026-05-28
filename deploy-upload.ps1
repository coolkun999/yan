# 「言」项目 - 一键上传修复文件到服务器
# 在 PowerShell 中直接运行: .\deploy-upload.ps1

$SERVER = "root@47.102.158.179"
$REMOTE = "/var/www/html/yan"
$LOCAL = "C:\Users\王坤\.openclaw\workspace\yan"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  「言」项目 - 上传修复文件到服务器" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "目标服务器: $SERVER" -ForegroundColor Yellow
Write-Host "远程路径:   $REMOTE" -ForegroundColor Yellow
Write-Host ""
Write-Host "上传文件列表:" -ForegroundColor Green
Write-Host "  [1] index.html  (修复: OG URL、分享链接、Twitter meta)" -ForegroundColor White
Write-Host "  [2] robots.txt  (修复: sitemap URL)" -ForegroundColor White
Write-Host "  [3] js/app.js   (修复: 分享链接 URL)" -ForegroundColor White
Write-Host ""

$count = 0
$total = 3

# 上传 index.html
$count++
Write-Host "[$count/$total] 上传 index.html ..." -ForegroundColor Cyan -NoNewline
scp "$LOCAL\index.html" "${SERVER}:${REMOTE}/index.html"
if ($LASTEXITCODE -eq 0) { Write-Host " OK" -ForegroundColor Green } else { Write-Host " FAILED" -ForegroundColor Red; exit 1 }

# 上传 robots.txt
$count++
Write-Host "[$count/$total] 上传 robots.txt ..." -ForegroundColor Cyan -NoNewline
scp "$LOCAL\robots.txt" "${SERVER}:${REMOTE}/robots.txt"
if ($LASTEXITCODE -eq 0) { Write-Host " OK" -ForegroundColor Green } else { Write-Host " FAILED" -ForegroundColor Red; exit 1 }

# 上传 js/app.js
$count++
Write-Host "[$count/$total] 上传 js/app.js ..." -ForegroundColor Cyan -NoNewline
scp "$LOCAL\js\app.js" "${SERVER}:${REMOTE}/js/app.js"
if ($LASTEXITCODE -eq 0) { Write-Host " OK" -ForegroundColor Green } else { Write-Host " FAILED" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  全部上传完成！" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "验证地址: https://www.kunshagj.com/yan/" -ForegroundColor Yellow
Write-Host ""
