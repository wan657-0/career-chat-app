@echo off
chcp 65001 >nul
title 职业规划智能体 - 服务器启动器 v1.0.1

echo ============================================================
echo    职业规划智能体 - 本地服务器 v1.0.1
echo ============================================================
echo.

:: 检查Python是否安装
echo [1/4] 检查Python环境...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到Python，请先安装Python 3.x
    echo 下载地址: https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)
echo ✓ Python已安装
echo.

:: 强制停止所有Python进程
echo [2/4] 停止所有旧的Python进程...
taskkill /f /im python.exe 2>nul
timeout /t 2 /nobreak >nul
echo ✓ 已清理旧进程
echo.

:: 检查端口
echo [3/4] 检查端口8000...
netstat -ano | findstr ":8000 " >nul
if not errorlevel 1 (
    echo ⚠️  端口8000仍被占用，尝试强制关闭...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 "') do (
        taskkill /f /pid %%a 2>nul
    )
    timeout /t 2 /nobreak >nul
)
echo ✓ 端口就绪
echo.

:: 启动服务器
echo [4/4] 启动服务器...
echo.
cd /d "%~dp0"

echo ============================================================
echo   服务器启动中...
echo.
echo   访问地址: http://localhost:8000/职业规划智能体.html
echo   健康检查: http://localhost:8000/api-health
echo.
echo   按 Ctrl+C 停止服务器
echo ============================================================
echo.

:: 延迟2秒后打开浏览器
start "" /min cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:8000/职业规划智能体.html"

python server.py

echo.
echo 服务器已停止
pause