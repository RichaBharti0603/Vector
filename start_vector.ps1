$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   VECTOR AIR TRAFFIC CONTROL SYSTEM     " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Redis
Write-Host "[1/4] Checking Redis..." -ForegroundColor Yellow
$redisStatus = Test-NetConnection -ComputerName localhost -Port 6379 -WarningAction SilentlyContinue
if (!$redisStatus.TcpTestSucceeded) {
    Write-Host "WARNING: Redis not detected on localhost:6379." -ForegroundColor Red
    Write-Host "If you have docker, attempting to start Redis..." -ForegroundColor Yellow
    try {
        docker run -d -p 6379:6379 redis:latest
        Write-Host "Redis started via Docker." -ForegroundColor Green
    } catch {
        Write-Host "Failed to start Redis. System will run in degraded mode." -ForegroundColor Red
    }
} else {
    Write-Host "Redis is online." -ForegroundColor Green
}

# 2. Setup cleanup
$global:Processes = @()
function Cleanup {
    Write-Host "Shutting down Vector systems..." -ForegroundColor Yellow
    foreach ($p in $global:Processes) {
        if ($p -and !$p.HasExited) {
            Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Host "Shutdown complete." -ForegroundColor Green
    exit
}
[Console]::TreatControlCAsInput = $false
[System.Console]::CancelKeyPress += {
    $_.Cancel = $true
    Cleanup
}

# 3. Start Backend Services
Write-Host "[2/4] Igniting Backend Microservices..." -ForegroundColor Yellow
$basePath = $PSScriptRoot

$services = @(
    @{ Name="Gateway"; Cmd=".\venv\Scripts\activate; python service_gateway.py"; Path="$basePath\backend" },
    @{ Name="Ingestion"; Cmd=".\venv\Scripts\activate; python service_ingestion.py"; Path="$basePath\backend" },
    @{ Name="VectorEngine"; Cmd=".\venv\Scripts\activate; python service_vector.py"; Path="$basePath\backend" },
    @{ Name="Orchestrator"; Cmd=".\venv\Scripts\activate; python service_orchestrator.py"; Path="$basePath\backend" },
    @{ Name="Frontend"; Cmd="npm run dev"; Path="$basePath\frontend" }
)

foreach ($svc in $services) {
    Write-Host "  -> Starting $($svc.Name)..."
    $proc = Start-Process powershell -ArgumentList "-Command", "cd '$($svc.Path)'; $($svc.Cmd)" -WindowStyle Hidden -PassThru
    $global:Processes += $proc
}

# 4. Start UI
Write-Host "[3/4] Warming up systems (5 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "[4/4] Launching Control Tower UI..." -ForegroundColor Yellow
$electronProc = Start-Process powershell -ArgumentList "-Command", "cd '$basePath\electron'; npm start" -WindowStyle Hidden -PassThru
$global:Processes += $electronProc

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host " SYSTEM ONLINE - MISSION CONTROL ACTIVE  " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Press Ctrl+C in this window to gracefully shut down."

try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Cleanup
}
