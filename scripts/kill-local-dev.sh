#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORTS=(3000 5001 5173 5174 4400 4401 4500 4501 9299 9300 9499 9500)

TARGET_PIDS=()

add_pid() {
  local pid="${1:-}"
  if [[ -n "$pid" && "$pid" != "$$" ]]; then
    TARGET_PIDS+=("$pid")
  fi
}

for port in "${PORTS[@]}"; do
  while IFS= read -r pid; do
    add_pid "$pid"
  done < <(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
done

while IFS= read -r pid; do
  add_pid "$pid"
done < <(
  ps -axo pid=,command= 2>/dev/null | awk -v root="$ROOT_DIR" 'index($0, root) && ($0 ~ /npm run dev($| )/ || $0 ~ /npm run dev:(firebase|functions|frontend)/ || $0 ~ /node_modules\/\.bin\/(concurrently|vite|firebase|tsx)/ || $0 ~ /node_modules\/@esbuild\/.*--service=/) { print $1 }'
)

if [[ "${#TARGET_PIDS[@]}" -eq 0 ]]; then
  echo "No local organizr dev processes found."
  exit 0
fi

UNIQUE_PIDS=($(printf "%s\n" "${TARGET_PIDS[@]}" | awk 'NF && !seen[$0]++'))

echo "Stopping local organizr dev processes: ${UNIQUE_PIDS[*]}"
if ! kill -TERM "${UNIQUE_PIDS[@]}" 2>/dev/null; then
  echo "Some processes did not accept SIGTERM. Checking what remains..."
fi
sleep 1

STILL_RUNNING=()
for pid in "${UNIQUE_PIDS[@]}"; do
  if kill -0 "$pid" 2>/dev/null; then
    STILL_RUNNING+=("$pid")
  fi
done

if [[ "${#STILL_RUNNING[@]}" -gt 0 ]]; then
  echo "Force killing remaining processes: ${STILL_RUNNING[*]}"
  kill -KILL "${STILL_RUNNING[@]}" 2>/dev/null || true
fi

FINAL_RUNNING=()
for pid in "${UNIQUE_PIDS[@]}"; do
  if kill -0 "$pid" 2>/dev/null; then
    FINAL_RUNNING+=("$pid")
  fi
done

if [[ "${#FINAL_RUNNING[@]}" -gt 0 ]]; then
  echo "Could not stop these processes: ${FINAL_RUNNING[*]}" >&2
  echo "Close their terminal tab or rerun this script from a normal terminal with permission." >&2
  exit 1
fi

echo "Local dev ports cleaned."
