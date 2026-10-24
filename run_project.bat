@echo off
title Khoi dong Du an SHOPKEY
echo ===================================================
echo     DANG KHOI DONG HE THONG SHOPKEY (XAMPP)
echo ===================================================

echo [1/3] Kiem tra va khoi dong MySQL...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] MySQL dang chay.
) else (
    echo Dang bat MySQL...
    start /b "" "D:\xampp\mysql\bin\mysqld.exe" --defaults-file="D:\xampp\mysql\bin\my.ini" --standalone
    timeout /t 2 >nul
    echo [OK] MySQL da duoc khoi dong.
)

echo [2/3] Kiem tra va khoi dong Apache...
tasklist /FI "IMAGENAME eq httpd.exe" 2>NUL | find /I /N "httpd.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] Apache dang chay tren cong 8080.
) else (
    echo Dang bat Apache...
    start /b "" "D:\xampp\apache\bin\httpd.exe"
    timeout /t 2 >nul
    echo [OK] Apache da duoc khoi dong.
)

echo [3/3] Mo trinh duyet...
start http://localhost:8080/

echo ===================================================
echo   DU AN DA KHOI DONG THANH CONG!
echo   - Trang chu:     http://localhost:8080/
echo   - Trang Admin:   http://localhost:8080/?module=vgprd&action=home
echo   - Tai khoan Admin: lumiltc / lumiltc
echo   - phpMyAdmin:    http://localhost:8080/phpmyadmin/
echo ===================================================
pause
