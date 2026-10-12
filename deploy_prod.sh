#!/usr/bin/env bash
# Ultimafia production update: one command.
#   ./deploy.sh            pull, install deps if changed, update site, rebuild nginx
#   ./deploy.sh --cleanup  only remove stopped/deprecated PM2 game processes (run later,
#                          after old game servers have drained)
# Lives in the repo root; set UM_DIR to override.
set -euo pipefail

UM_DIR="${UM_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
COMPOSE=(docker compose -f docker-compose-core.yml -f docker-compose-prod.yml)
say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

cd "$UM_DIR"

cleanup() {
  say "PM2 processes"
  docker exec backend pm2 list
  ids=$(docker exec backend sh -c 'pm2 jlist | node -e "
    let s=\"\";process.stdin.on(\"data\",d=>s+=d).on(\"end\",()=>{
      const l=JSON.parse(s.slice(s.indexOf(\"[\")));
      console.log(l.filter(p=>[\"stopped\",\"errored\"].includes(p.pm2_env.status)).map(p=>p.pm_id).join(\" \"));});"')
  if [ -z "$ids" ]; then echo "No stopped/errored PM2 processes. Nothing to clean."; return; fi
  echo "Stopped/errored PM2 ids: $ids"
  read -r -p "Delete these? [y/N] " a
  if [[ "$a" =~ ^[Yy]$ ]]; then
    for id in $ids; do docker exec backend pm2 delete "$id"; done
    docker exec backend pm2 list
  else echo "Skipped."; fi
}

if [ "${1:-}" = "--cleanup" ]; then cleanup; exit 0; fi

say "git status"
git status --short --branch
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "Local changes to tracked files. Commit or stash them first."; exit 1
fi

say "git fetch + pull"
OLD=$(git rev-parse HEAD)
git fetch
git pull --ff-only
NEW=$(git rev-parse HEAD)
if [ "$OLD" = "$NEW" ]; then echo "Already up to date ($NEW)."
else git log --oneline "$OLD..$NEW"; fi

if [ "$OLD" != "$NEW" ] && git diff --name-only "$OLD" "$NEW" | grep -qxE 'package(-lock)?\.json'; then
  say "Backend dependencies changed: npm install"
  docker exec backend npm install
else
  echo "No backend dependency changes; skipping npm install."
fi

say "update_site.sh"
bash update_site.sh

say "Rebuild + restart nginx (no cache)"
"${COMPOSE[@]}" build nginx --no-cache
"${COMPOSE[@]}" up -d nginx

say "Done. Current PM2 processes:"
docker exec backend pm2 list
echo
echo "Old game servers drain as their games finish. Once they have, run:"
echo "  $0 --cleanup"
