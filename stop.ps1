# DinLink — Stop all dev services
# Usage:  .\stop.ps1

$ErrorActionPreference = "SilentlyContinue"

Write-Host ""
Write-Host "Stopping DinLink dev stack..." -ForegroundColor Yellow

# Kill uvicorn + vite processes (backend + frontend)
Write-Host "  - Stopping backend (uvicorn)..." -ForegroundColor Gray
Get-CimInstance Win32_Process -Filter "Name = 'python.exe'" |
    Where-Object { $_.CommandLine -like "*uvicorn*app.main*" } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force }

Write-Host "  - Stopping frontend (vite)..." -ForegroundColor Gray
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
    Where-Object { $_.CommandLine -like "*vite*" } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force }

# Stop DB container
Write-Host "  - Stopping PostgreSQL..." -ForegroundColor Gray
docker compose stop db 2>&1 | Out-Null

Write-Host ""
Write-Host "All services stopped." -ForegroundColor Green
Write-Host ""
