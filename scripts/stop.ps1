$ErrorActionPreference = "SilentlyContinue"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Stop-FromPidFile([string]$Name) {
    $pidFile = Join-Path $Root ".run\$Name.pid"
    if (-not (Test-Path $pidFile)) {
        Write-Host "    $Name : sin PID registrado"
        return
    }
    $processId = (Get-Content $pidFile | Select-Object -First 1).Trim()
    if ($processId) {
        taskkill /PID $processId /T /F 2>$null | Out-Null
        Write-Host "    $Name detenido (PID $processId)"
    }
    Remove-Item $pidFile -Force
}

Write-Host "Deteniendo procesos locales..."
Stop-FromPidFile "frontend"
Stop-FromPidFile "backend"

Write-Host "Deteniendo contenedores backend/frontend (si estan activos)..."
docker compose --profile full stop backend frontend 2>$null | Out-Null

Write-Host "PostgreSQL sigue en Docker. Para detenerlo: docker compose stop postgres"
