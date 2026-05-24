Write-Host "Starting Vector Microservices Architecture..." -ForegroundColor Cyan
Write-Host "Make sure Redis is running on localhost:6379" -ForegroundColor Yellow

$ErrorActionPreference = "SilentlyContinue"

# Start Gateway (Port 8001)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\richa\OneDrive\Desktop\ai email trainage\ai-atc-system\backend'; .\venv\Scripts\activate; python service_gateway.py" -WindowStyle Normal

# Start Ingestion (Port 8000)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\richa\OneDrive\Desktop\ai email trainage\ai-atc-system\backend'; .\venv\Scripts\activate; python service_ingestion.py" -WindowStyle Normal

# Start Vector Engine Worker
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\richa\OneDrive\Desktop\ai email trainage\ai-atc-system\backend'; .\venv\Scripts\activate; python service_vector.py" -WindowStyle Normal

# Start Orchestrator Worker
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\richa\OneDrive\Desktop\ai email trainage\ai-atc-system\backend'; .\venv\Scripts\activate; python service_orchestrator.py" -WindowStyle Normal

Write-Host "All services launched in separate windows!" -ForegroundColor Green
