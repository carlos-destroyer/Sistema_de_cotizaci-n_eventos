#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

kill_tree() {
  local name="$1"
  local pid_file="$ROOT/.run/$name.pid"
  if [ ! -f "$pid_file" ]; then
    echo "    $name: sin PID registrado"
    return
  fi
  local process_id
  process_id="$(head -n1 "$pid_file" | tr -d '\r')"
  if [ -n "$process_id" ] && kill -0 "$process_id" 2>/dev/null; then
    if command -v pkill >/dev/null 2>&1; then
      pkill -TERM -P "$process_id" 2>/dev/null || true
    fi
    kill "$process_id" 2>/dev/null || true
    echo "    $name detenido (PID $process_id)"
  else
    echo "    $name: el proceso ya no estaba activo"
  fi
  rm -f "$pid_file"
}

echo "Deteniendo procesos locales..."
kill_tree frontend
kill_tree backend

echo "PostgreSQL sigue en Docker. Para detenerlo: docker compose stop postgres"
