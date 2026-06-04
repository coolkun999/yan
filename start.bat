@echo off
echo.
echo ========================================
echo   言 (Yan) - 本地开发环境
echo ========================================
echo.

REM 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未安装 Node.js
    echo 请访问 https://nodejs.org/ 下载安装
    pause
    exit /b 1
)

REM 检查 Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [警告] 未安装 Python，部分功能可能不可用
)

echo [1/3] 安装后端依赖...
cd server
call npm install
cd ..

echo.
echo [2/3] 启动后端服务...
echo 后端地址: http://localhost:3000
echo API 文档: http://localhost:3000/api/health
echo.
echo 按 Ctrl+C 停止服务
echo.

start http://localhost:3000

cd server
node index.js
