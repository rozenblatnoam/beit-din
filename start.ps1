# DinLink - Start all services in dev
# Usage:  .\start.ps1

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host ""
Write-Host "DinLink - starting dev stack" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# 1. Verify Docker Desktop is running (wait up to 30s for startup)
Write-Host ""
Write-Host "[1/4] Checking Docker..." -ForegroundColor Yellow
$dockerOK = $false
for ($i = 1; $i -le 30; $i++) {
    $null = docker info --format "{{.ServerVersion}}" 2>$null
    if ($LASTEXITCODE -eq 0) { $dockerOK = $true; break }
    if ($i -eq 1) { Write-Host "  Waiting for Docker Desktop..." -ForegroundColor Gray }
    Start-Sleep -Seconds 1
}
if (-not $dockerOK) {
    Write-Host "  Docker Desktop is not running." -ForegroundColor Red
    Write-Host "  Open Docker Desktop from the Start menu, wait for the whale icon to turn green, then try again." -ForegroundColor Red
    exit 1
}
Write-Host "  Docker OK" -ForegroundColor Green

# 2. Start DB container (detached)
Write-Host ""
Write-Host "[2/4] Starting PostgreSQL (port 5433)..." -ForegroundColor Yellow
docker compose up -d db | Out-Null

# Wait for healthy
Write-Host "  Waiting for DB to be healthy..." -ForegroundColor Gray
$maxTries = 30
for ($i = 1; $i -le $maxTries; $i++) {
    $status = docker inspect -f "{{.State.Health.Status}}" beit-din-db-1 2>$null
    if ($status -eq "healthy") {
        Write-Host "  DB healthy" -ForegroundColor Green
        break
    }
    if ($i -eq $maxTries) {
        Write-Host "  DB failed to become healthy after $maxTries seconds" -ForegroundColor Red
        exit 1
    }
    Start-Sleep -Seconds 1
}

# 3. Run pending migrations
Write-Host ""
Write-Host "[3/4] Applying migrations..." -ForegroundColor Yellow
Push-Location "$root\backend"
alembic upgrade head | Out-Null
$migRc = $LASTEXITCODE
Pop-Location
if ($migRc -ne 0) {
    Write-Host "  Migration failed (exit code $migRc). Run 'alembic upgrade head' in backend/ to see the error." -ForegroundColor Red
    exit 1
}
Write-Host "  Migrations up to date" -ForegroundColor Green

# 4. Open backend + frontend in new terminal windows
Write-Host ""
Write-Host "[4/4] Launching backend + frontend..." -ForegroundColor Yellow

$backendCmd = "cd '$root\backend'; python -m uvicorn app.main:app --reload --port 8000"
$frontendCmd = "cd '$root\frontend'; npm run dev"

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "DinLink is starting up" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  DB:       localhost:5433   (docker)" -ForegroundColor White
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "  Swagger:  http://localhost:8000/docs" -ForegroundColor White
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "To stop: close the backend/frontend terminals, then run .\stop.ps1" -ForegroundColor Gray
Write-Host ""
