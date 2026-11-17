[CmdletBinding()]
param(
    [ValidateSet("dev", "docker", "db")]
    [string]$Mode = "dev",
    [switch]$Reset
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
$RunDir = Join-Path $Root ".run"
New-Item -ItemType Directory -Force -Path $RunDir | Out-Null

function Write-Step([string]$Message) {
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Assert-Command([string]$Name, [string]$Hint) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "No se encontro '$Name'. $Hint"
    }
}

function Get-EnvValue([string]$Key, [string]$Default) {
    if (Test-Path (Join-Path $Root ".env")) {
        $line = Get-Content (Join-Path $Root ".env") |
            Where-Object { $_ -match "^$([regex]::Escape($Key))=" } |
            Select-Object -First 1
        if ($line) {
            return ($line -split "=", 2)[1].Trim()
        }
    }
    return $Default
}

function Test-Http([string]$Url) {
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
        return $response.StatusCode -ge 200 -and $response.StatusCode -lt 400
    }
    catch {
        return $false
    }
}

function Wait-Http([string]$Url, [int]$Seconds, [string]$Label, [string]$LogFile) {
    $deadline = (Get-Date).AddSeconds($Seconds)
    while ((Get-Date) -lt $deadline) {
        if (Test-Http $Url) {
            Write-Host "    $Label listo." -ForegroundColor Green
            return $true
        }
        Start-Sleep -Seconds 2
    }
    Write-Warning "    $Label no respondio en $Seconds segundos."
    if ($LogFile -and (Test-Path $LogFile)) {
        Write-Host "    Ultimas lineas de $LogFile :" -ForegroundColor Yellow
        Get-Content $LogFile -Tail 25
    }
    return $false
}

Write-Step "Verificando herramientas"
Assert-Command "docker" "Instala Docker Desktop y vuelve a intentar."
try {
    docker info 2>$null | Out-Null
}
catch {
    throw "Docker no esta iniciado. Abre Docker Desktop y vuelve a intentar."
}
Write-Host "    Docker OK"

if ($Mode -ne "db") {
    Assert-Command "java" "Instala JDK 21 o superior y configura JAVA_HOME."
    Write-Host "    Java OK"
}
if ($Mode -eq "dev") {
    Assert-Command "node" "Instala Node.js 22 o superior."
    Assert-Command "npm" "Instala Node.js 22 o superior."
    Write-Host "    Node/npm OK"
}

Write-Step "Preparando variables de entorno"
if (-not (Test-Path (Join-Path $Root ".env"))) {
    Copy-Item (Join-Path $Root ".env.example") (Join-Path $Root ".env")
    Write-Host "    .env creado a partir de .env.example"
}
else {
    Write-Host "    .env existente"
}

if ($Reset) {
    Write-Step "Reiniciando base de datos (se eliminara el volumen)"
    docker compose down -v
}

Write-Step "Iniciando PostgreSQL"
docker compose up -d postgres

$deadline = (Get-Date).AddSeconds(90)
$dbHealthy = $false
while ((Get-Date) -lt $deadline) {
    $status = docker inspect --format "{{.State.Health.Status}}" mm-eventos-db 2>$null
    if ($status -eq "healthy") {
        $dbHealthy = $true
        break
    }
    Start-Sleep -Seconds 2
}
if (-not $dbHealthy) {
    throw "PostgreSQL no llego a estado healthy. Revisa 'docker compose logs postgres'."
}
Write-Host "    PostgreSQL healthy" -ForegroundColor Green

if ($Mode -eq "db") {
    Write-Step "Base de datos lista"
    Write-Host "    Host: localhost:$(Get-EnvValue 'POSTGRES_PORT' '5433')"
    Write-Host "    DB:   $(Get-EnvValue 'POSTGRES_DB' 'mm_eventos')"
    Write-Host "    User: $(Get-EnvValue 'POSTGRES_USER' 'mm_eventos')"
    exit 0
}

if ($Mode -eq "docker") {
    Write-Step "Construyendo y levantando backend + frontend en Docker"
    docker compose --profile full up -d --build
    $backendPort = Get-EnvValue "BACKEND_PORT" "8081"
    $frontendPort = Get-EnvValue "FRONTEND_PORT" "3000"
    $null = Wait-Http "http://localhost:$backendPort/actuator/health" 180 "Backend" ""
    $null = Wait-Http "http://localhost:$frontendPort" 120 "Frontend" ""
    Write-Step "Sistema disponible"
    Write-Host "    Frontend: http://localhost:$frontendPort"
    Write-Host "    API:      http://localhost:$backendPort/api"
    Write-Host "    Detener:  docker compose --profile full down"
    exit 0
}

Write-Step "Preparando dependencias del frontend"
if (-not (Test-Path (Join-Path $Root "frontend\node_modules"))) {
    Push-Location (Join-Path $Root "frontend")
    try {
        npm install
        if ($LASTEXITCODE -ne 0) { throw "npm install fallo." }
    }
    finally {
        Pop-Location
    }
}
else {
    Write-Host "    node_modules ya existe"
}

$backendPort = Get-EnvValue "BACKEND_PORT" "8081"
$frontendPort = Get-EnvValue "FRONTEND_PORT" "3000"

Write-Step "Iniciando backend en segundo plano"
if (Test-Http "http://localhost:$backendPort/actuator/health") {
    Write-Host "    El backend ya esta respondiendo en el puerto $backendPort"
}
else {
    $backendLog = Join-Path $RunDir "backend.log"
    $backendErr = Join-Path $RunDir "backend.err.log"
    $backend = Start-Process `
        -FilePath (Join-Path $Root "backend\mvnw.cmd") `
        -ArgumentList "-DskipTests", "spring-boot:run" `
        -WorkingDirectory (Join-Path $Root "backend") `
        -RedirectStandardOutput $backendLog `
        -RedirectStandardError $backendErr `
        -WindowStyle Hidden `
        -PassThru
    Set-Content -Path (Join-Path $RunDir "backend.pid") -Value $backend.Id
    if (-not (Wait-Http "http://localhost:$backendPort/actuator/health" 180 "Backend" $backendErr)) {
        throw "El backend no arranco. Revisa .run/backend.err.log"
    }
}

Write-Step "Iniciando frontend en segundo plano"
if (Test-Http "http://localhost:$frontendPort") {
    Write-Host "    El frontend ya esta respondiendo en el puerto $frontendPort"
}
else {
    $frontendLog = Join-Path $RunDir "frontend.log"
    $frontendErr = Join-Path $RunDir "frontend.err.log"
    $frontend = Start-Process `
        -FilePath "npm.cmd" `
        -ArgumentList "run", "dev" `
        -WorkingDirectory (Join-Path $Root "frontend") `
        -RedirectStandardOutput $frontendLog `
        -RedirectStandardError $frontendErr `
        -WindowStyle Hidden `
        -PassThru
    Set-Content -Path (Join-Path $RunDir "frontend.pid") -Value $frontend.Id
    if (-not (Wait-Http "http://localhost:$frontendPort" 120 "Frontend" $frontendErr)) {
        throw "El frontend no arranco. Revisa .run/frontend.err.log"
    }
}

Write-Step "Sistema disponible"
Write-Host "    Frontend: http://localhost:$frontendPort"
Write-Host "    API:      http://localhost:$backendPort/api"
Write-Host "    Health:   http://localhost:$backendPort/actuator/health"
Write-Host "    Logs:     .run/"
Write-Host "    Detener:  .\scripts\stop.ps1"
Write-Host ""
Write-Host "Los datos demo y el catalogo se cargan automaticamente al iniciar el backend." -ForegroundColor DarkGray
