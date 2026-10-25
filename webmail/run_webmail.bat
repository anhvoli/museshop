@echo off
title Khoi dong cPanel Webmail Suite
echo ========================================================
echo   KHOI DONG CPANEL WEBMAIL & UAPI MANAGER (REACT + NODE)
echo ========================================================
echo Host:   nckh.anhvoli.id.vn
echo User:   eh8vxynb05pr
echo Ports:  IMAP 993 (SSL) / SMTP 465 (SSL) / cPanel 2083
echo ========================================================

echo Dang khoi dong Webmail Server (Port 5050)...
start "cPanel Webmail Server" /min cmd /c "cd /d %~dp0 && node server.js"
timeout /t 2 >nul

echo ========================================================
echo   WEBMAIL SUITE DA KHOI DONG THANH CONG!
echo   👉 Ung dung Webmail: http://localhost:5050
echo   👉 REST API Backend: http://localhost:5050/api
echo ========================================================

start http://localhost:5050
pause
