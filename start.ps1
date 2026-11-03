# Start ChurnIQ Project
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "Starting ChurnIQ..." -ForegroundColor Cyan

# Start Backend
Start-Process cmd -ArgumentList "/k", "cd /d $scriptPath && C:\Users\Admin\AppData\Local\Python\bin\python.exe -m uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload" -WindowStyle Normal
Start-Sleep -Seconds 5

# Start Frontend
Start-Process cmd -ArgumentList "/k", "cd /d $scriptPath\frontend && set PATH=C:\Program Files\nodejs;%PATH% && npm.cmd run dev -- --port 8081" -WindowStyle Normal
Start-Sleep -Seconds 5

# Open browser
Start-Process "http://localhost:8081"

Write-Host "ChurnIQ started!" -ForegroundColor Green
