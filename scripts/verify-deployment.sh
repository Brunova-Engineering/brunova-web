#!/bin/sh
set -eu

container_id="$(docker compose ps -q web)"
if [ -z "$container_id" ]; then
  echo "Brunova web container is not running." >&2
  exit 1
fi

health_state="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}' "$container_id")"
if [ "$health_state" != "healthy" ]; then
  echo "Brunova web container is not healthy: $health_state" >&2
  exit 1
fi

docker compose exec -T web node /app/scripts/container-smoke.mjs

echo "Deployment verification passed."
