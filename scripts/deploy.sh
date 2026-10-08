#!/bin/sh
set -eu

for command_name in docker git; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Required command is unavailable: $command_name" >&2
    exit 1
  fi
done

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose v2 is required." >&2
  exit 1
fi

if [ ! -f .env ]; then
  echo "Missing .env. Copy .env.example to .env and configure production values." >&2
  exit 1
fi

if ! git check-ignore -q .env; then
  echo ".env must remain ignored by Git." >&2
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Tracked files are dirty. Deploy only an identified Git revision." >&2
  exit 1
fi

deployment_revision="$(git rev-parse HEAD)"
deployment_short_revision="$(git rev-parse --short=12 HEAD)"
export VCS_REF="$deployment_revision"
export IMAGE_TAG="${IMAGE_TAG:-$deployment_short_revision}"

docker compose config --quiet
docker compose build
docker run --rm --env-file .env --entrypoint node "brunova-web:${IMAGE_TAG}" \
  /app/scripts/validate-production-env.mjs
docker compose up -d --remove-orphans

container_id="$(docker compose ps -q web)"
if [ -z "$container_id" ]; then
  echo "Compose did not create the Brunova web container." >&2
  exit 1
fi

attempt=0
while [ "$attempt" -lt 60 ]; do
  health_state="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}' "$container_id" 2>/dev/null || true)"
  if [ "$health_state" = "healthy" ]; then
    break
  fi
  if [ "$health_state" = "unhealthy" ]; then
    docker compose logs --no-color --tail=100 web >&2
    echo "Deployment failed: container became unhealthy." >&2
    exit 1
  fi
  attempt=$((attempt + 1))
  sleep 1
done

if [ "${health_state:-missing}" != "healthy" ]; then
  docker compose logs --no-color --tail=100 web >&2
  echo "Deployment failed: health timeout." >&2
  exit 1
fi

./scripts/verify-deployment.sh

echo "Brunova revision $deployment_revision is healthy."
echo "Inspect status with: docker compose ps"
echo "Follow logs with: docker compose logs -f web"
