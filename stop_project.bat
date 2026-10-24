@echo off
title Dung Du an SHOPKEY
echo Dang dung Apache va MySQL...
taskkill /F /IM httpd.exe 2>NUL
taskkill /F /IM mysqld.exe 2>NUL
echo Da dung tat ca dich vu!
pause
