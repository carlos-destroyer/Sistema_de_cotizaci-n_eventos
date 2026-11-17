#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

MODE="${1:-dev}"
RESET="${2:-}"
RUN_DIR="$ROOT/.run"
mkdir -p "$RUN_DIR"

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  echo "ERROR: Docker Compose no esta disponible." >&2
  exit 1
fi

step() { echo; echo "==> $*"; }

env_value() {
  local key="$1" fallback="$2"
  if [ -f "$ROOT/.env" ]; then
    local line
    line="$(grep -E "^${key}=" "$ROOT/.env" | head -n1 || true)"
    if [ -n "$line" ]; then
      echo "${line#*=}" | tr -d '\r'
      return
    fi
  fi
  echo "$fallback"
}

http_ok() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsS --max-time 3 "$1" >/dev/null 2>&1
  else
    wget -q -T 3 -O /dev/null "$1" >/dev/null 2>&1
  fi
}

wait_http() {
  local url="$1" seconds="$2" label="$3" log="$4"
  local deadline=$((SECONDS + seconds))
  while [ $SECONDS -lt $deadline ]; do
    if http_ok "$url"; then
      echo "    $label listo."
      return 0
    fi
    sleep 2
  done
  echo "ADVERTENCIA: $label no respondio en $seconds segundos." >&2
  if [ -f "$log" ]; then
    echo "    Ultimas lineas de $log:" >&2
    tail -n 25 "$log" >&2 || true
  fi
  return 1
}

case "$MODE" in
  dev|db|docker) ;;
  *) echo "Uso: $0 [dev|db|docker] [--reset]" >&2; exit 1 ;;
esac

step "Verificando Docker"
if ! docker info >/dev/null 2>&1; then
  echo "ERROR: Docker no esta iniciado." >&2
  exit 1
fi

if [ "$MODE" != "db" ]; then
  command -v java >/dev/null 2>&1 || { echo "ERROR: falta Java 21+." >&2; exit 1; }
fi
if [ "$MODE" = "dev" ]; then
  command -v node >/dev/null 2>&1 || { echo "ERROR: falta Node.js 22+." >&2; exit 1; }
  command -v npm >/dev/null 2>&1 || { echo "ERROR: falta npm." >&2; exit 1; }
fi

step "Preparando variables de entorno"
if [ ! -f "$ROOT/.env" ]; then
  cp "$ROOT/.env.example" "$ROOT/.env"
  echo "    .env creado a partir de .env.example"
else
  echo "    .env existente"
fi

if [ "$RESET" = "--reset" ]; then
  step "Reiniciando base de datos (se eliminara el volumen)"
  "${COMPOSE[@]}" down -v
fi

step "Iniciando PostgreSQL"
"${COMPOSE[@]}" up -d postgres

deadline=$((SECONDS + 90))
db_ok=0
while [ $SECONDS -lt $deadline ]; do
  status="$(docker inspect --format '{{.State.Health.Status}}' mm-eventos-db 2>/dev/null || true)"
  if [ "$status" = "healthy" ]; then
    db_ok=1
    break
  fi
  sleep 2
done
if [ "$db_ok" -ne 1 ]; then
  echo "ERROR: PostgreSQL no llego a healthy. Revisa: ${COMPOSE[*]} logs postgres" >&2
  exit 1
fi
echo "    PostgreSQL healthy"

if [ "$MODE" = "db" ]; then
  step "Base de datos lista"
  echo "    Host: localhost:$(env_value POSTGRES_PORT 5433)"
  echo "    DB:   $(env_value POSTGRES_DB mm_eventos)"
  echo "    User: $(env_value POSTGRES_USER mm_eventos)"
  exit 0
fi

if [ "$MODE" = "docker" ]; then
  step "Construyendo y levantando backend + frontend en Docker"
  "${COMPOSE[@]}" --profile full up -d --build
  wait_http "http://localhost:$(env_value BACKEND_PORT 8081)/actuator/health" 180 "Backend" "" || true
  wait_http "http://localhost:$(env_value FRONTEND_PORT 3000)" 120 "Frontend" "" || true
  step "Sistema disponible"
  echo "    Frontend: http://localhost:$(env_value FRONTEND_PORT 3000)"
  echo "    API:      http://localhost:$(env_value BACKEND_PORT 8081)/api"
  echo "    Detener:  ${COMPOSE[*]} --profile full down"
  exit 0
fi

step "Preparando dependencias del frontend"
if [ ! -d "$ROOT/frontend/node_modules" ]; then
  (cd "$ROOT/frontend" && npm install)
else
  echo "    node_modules ya existe"
fi

BACKEND_PORT="$(env_value BACKEND_PORT 8081)"
FRONTEND_PORT="$(env_value FRONTEND_PORT 3000)"

step "Iniciando backend en segundo plano"
if http_ok "http://localhost:$BACKEND_PORT/actuator/health"; then
  echo "    El backend ya esta respondiendo en el puerto $BACKEND_PORT"
else
  (
    cd "$ROOT/backend"
    nohup ./mvnw -DskipTests spring-boot:run >"$RUN_DIR/backend.log" 2>&1 &
    echo $! >"$RUN_DIR/backend.pid"
  )
  wait_http "http://localhost:$BACKEND_PORT/actuator/health" 180 "Backend" "$RUN_DIR/backend.log" || exit 1
fi

step "Iniciando frontend en segundo plano"
if http_ok "http://localhost:$FRONTEND_PORT"; then
  echo "    El frontend ya esta respondiendo en el puerto $FRONTEND_PORT"
else
  (
    cd "$ROOT/frontend"
    nohup npm run dev >"$RUN_DIR/frontend.log" 2>&1 &
    echo $! >"$RUN_DIR/frontend.pid"
  )
  wait_http "http://localhost:$FRONTEND_PORT" 120 "Frontend" "$RUN_DIR/frontend.log" || exit 1
fi

step "Sistema disponible"
echo "    Frontend: http://localhost:$FRONTEND_PORT"
echo "    API:      http://localhost:$BACKEND_PORT/api"
echo "    Health:   http://localhost:$BACKEND_PORT/actuator/health"
echo "    Logs:     .run/"
echo "    Detener:  ./scripts/stop.sh"
