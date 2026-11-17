#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  echo "ERROR: Docker Compose no esta disponible." >&2
  exit 1
fi

read -r -p "Esto eliminara la base de datos y todos sus datos. Escribe SI para continuar: " answer
if [ "$answer" != "SI" ]; then
  echo "Cancelado."
  exit 0
fi

"${COMPOSE[@]}" down -v
"${COMPOSE[@]}" up -d postgres

deadline=$((SECONDS + 90))
while [ $SECONDS -lt $deadline ]; do
  status="$(docker inspect --format '{{.State.Health.Status}}' mm-eventos-db 2>/dev/null || true)"
  if [ "$status" = "healthy" ]; then
    echo "Base de datos recreada y healthy."
    echo "Al reiniciar el backend se volveran a cargar el catalogo y los datos demo."
    exit 0
  fi
  sleep 2
done

echo "ERROR: PostgreSQL no llego a healthy." >&2
exit 1
