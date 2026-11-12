@echo off
title Smart Agriculture - Khoi Dong He Thong
color 0A

echo ================================================================
echo    SMART AGRICULTURE - KHOI DONG BACKEND VA MOBILE EXPO
echo ================================================================
echo.

:: 1. Kiem tra va khoi dong Backend trong cua so rieng
echo [1/2] Dang khoi dong Backend Server (Port 5000)...
start "Smart Agriculture - Backend Server (Port 5000)" cmd /k "cd /d \"%~dp0backend\" && pnpm start"

:: 2. Doi 2 giay de Backend on dinh
timeout /t 2 /nobreak >nul

:: 3. Khoi dong Mobile Expo trong cua so rieng (de hien thi ma QR Code)
echo [2/2] Dang khoi dong Mobile Expo App...
start "Smart Agriculture - Mobile Expo (QR Code)" cmd /k "cd /d \"%~dp0mobile\" && npx expo start -c"

echo.
echo ================================================================
echo  ✓ DA KHOI DONG THANH CONG!
echo  - Cua so 1: Backend Node.js dang chay tai http://localhost:5000
echo  - Cua so 2: Mobile Expo dang mo, hay dung Expo Go tren dien thoai
echo               de quet ma QR Code va trai nghiem ung dung.
echo  - MQTT Broker: Dang su dung Cloud Broker broker.emqx.io:1883
echo ================================================================
echo.
pause

