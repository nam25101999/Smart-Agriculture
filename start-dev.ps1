# Smart Agriculture - Khoi dong Backend & Mobile
Write-Host "================================================================" -ForegroundColor Green
Write-Host "   SMART AGRICULTURE - KHOI DONG BACKEND VA MOBILE EXPO" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green

# 1. Khoi dong Backend trong cua so rieng
Write-Host "[1/2] Dang khoi dong Backend Server (Port 5000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; pnpm start"

Start-Sleep -Seconds 2

# 2. Khoi dong Mobile Expo trong cua so rieng (co QR Code de quet)
Write-Host "[2/2] Dang khoi dong Mobile Expo App..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\mobile'; npx expo start -c"

Write-Host "Da mo 2 cua so rieng biet de ban de dang theo doi log va quet ma QR!" -ForegroundColor Green

