$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$answer = Read-Host "Esto eliminara la base de datos y todos sus datos. Escribe SI para continuar"
if ($answer -ne "SI") {
    Write-Host "Cancelado."
    exit 0
}

docker compose down -v
docker compose up -d postgres

$deadline = (Get-Date).AddSeconds(90)
while ((Get-Date) -lt $deadline) {
    $status = docker inspect --format "{{.State.Health.Status}}" mm-eventos-db 2>$null
    if ($status -eq "healthy") {
        Write-Host "Base de datos recreada y healthy." -ForegroundColor Green
        Write-Host "Al reiniciar el backend se volveran a cargar el catalogo y los datos demo."
        exit 0
    }
    Start-Sleep -Seconds 2
}
throw "PostgreSQL no llego a estado healthy."
