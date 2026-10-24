@echo off
title Khoi dong SHOPKEY React + Node.js Fullstack
echo ========================================================
echo   KHOI DONG HE THONG SHOPKEY (REACT + NODE.JS REST API)
echo ========================================================

echo [1/3] Kiem tra va khoi dong MySQL...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] MySQL dang chay tren cong 3306.
) else (
    echo Dang khoi dong MySQL...
    start /b "" "D:\xampp\mysql\bin\mysqld.exe" --defaults-file="D:\xampp\mysql\bin\my.ini" --standalone
    timeout /t 2 >nul
    echo [OK] MySQL da san sang.
)

echo [2/3] Khoi dong Backend Node.js API (Port 5000)...
start "SHOPKEY Backend API" /min cmd /c "cd /d D:\SHOPKEY-main\backend && node src/server.js"
timeout /t 2 >nul
echo [OK] Backend API da bat.

echo [3/3] Khoi dong Frontend React SPA (Port 5173)...
start "SHOPKEY Frontend React" /min cmd /c "cd /d D:\SHOPKEY-main\frontend && npm run dev"
timeout /t 3 >nul
echo [OK] Frontend React da bat.

echo ========================================================
echo   DU AN REACT FULLSTACK DA HOAT DONG!
echo   - Giao dien Web:     http://localhost:5173/
echo   - Trang Quan tri:    http://localhost:5173/admin
echo   - REST API Backend:  http://localhost:5000/api
echo   - Tai khoan Admin:   lumiltc / lumiltc
echo ========================================================

start http://localhost:5173/
pause
