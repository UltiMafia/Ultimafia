#!/usr/bin/bash
#
# Pre-update check for the production stack.
#
# The backend writes into two bind-mounted host directories:
#   logs/     winston request and error logs (modules/logging.js)
#   uploads/  avatars, banners, family art, death sounds (routes/user.js, family.js)
#
# While the backend runs as root it can write anywhere, so the current setup
# hides ownership problems. If the Dockerfile declares a non-root USER, those
# directories must be owned by that uid before the next backend rebuild. This
# check reports the exact commands to run, and stops the update when the
# already-running backend cannot write them.
#
# Called from update_site.sh after `git pull` and before any service restart.
#
# Exit status:
#   0  nothing to do, or only a future rebuild is affected (warning printed)
#   1  the running backend cannot write logs/uploads; the update should stop
#
# BACKEND_CONTAINER overrides the container name (for testing only).

set -uo pipefail

project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_dir"

container="${BACKEND_CONTAINER:-backend}"
dockerfile="$project_dir/dockerfile"

if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
  echo "Deploy check: Docker is not available; skipping ownership check."
  exit 0
fi

if [[ ! -f "$dockerfile" ]]; then
  echo "Deploy check: no dockerfile found; skipping ownership check."
  exit 0
fi

# Last USER instruction wins, matching Docker's behaviour.
declared_user="$(awk 'toupper($1) == "USER" { user = $2 } END { if (user != "") print user }' "$dockerfile")"
declared_uid_part="${declared_user%%:*}"
declared_gid_part=""
if [[ "$declared_user" == *:* ]]; then
  declared_gid_part="${declared_user#*:}"
fi

echo "Deploy check: backend writes to logs/ and uploads/"

image_id="$(docker inspect --format '{{.Image}}' "$container" 2>/dev/null || true)"

resolve_uid() { # $1 = user name or numeric uid
  local who="$1"
  if [[ "$who" =~ ^[0-9]+$ ]]; then
    printf '%s\n' "$who"
  elif [[ -n "$image_id" ]]; then
    docker run --rm --entrypoint id "$image_id" -u "$who" 2>/dev/null || true
  fi
}

resolve_gid() { # $1 = numeric gid, or fall back to the uid's primary group
  local group="$1" who="$2"
  if [[ "$group" =~ ^[0-9]+$ ]]; then
    printf '%s\n' "$group"
  elif [[ -n "$image_id" ]]; then
    docker run --rm --entrypoint id "$image_id" -g "$who" 2>/dev/null || true
  fi
}

target_uid=0
target_gid=0
if [[ -n "$declared_user" ]]; then
  target_uid="$(resolve_uid "$declared_uid_part")"
  if [[ -z "$target_uid" ]]; then
    echo "Deploy check: could not resolve USER $declared_user; skipping ownership check."
    exit 0
  fi
  target_gid="$(resolve_gid "$declared_gid_part" "$declared_uid_part")"
  if [[ -z "$target_gid" ]]; then
    target_gid="$target_uid"
  fi
fi

running_uid="$(docker exec "$container" id -u 2>/dev/null || true)"
running_gid="$(docker exec "$container" id -g 2>/dev/null || true)"

# Escape hatch when the site is down or the container is being rebuilt.
if [[ -z "$running_uid" ]]; then
  echo "Deploy check: $container is not running; cannot check the live user."
  if [[ "$target_uid" != "0" ]]; then
    echo "  After it starts it will run as uid $target_uid:$target_gid."
    echo "  Make sure logs/ and uploads/ are writable by that uid before rebuilding."
  fi
  exit 0
fi

missing_dirs=()
for dir in logs/chat logs/games uploads; do
  [[ -d "$dir" ]] || missing_dirs+=("$dir")
done

can_write() { # $1 = uid, $2 = gid; returns nonzero when the backend cannot write
  local uid="$1" gid="$2"
  [[ -n "$image_id" ]] || return 0
  docker run --rm --user "$uid:$gid" -v "$project_dir:/home/um:rw" \
    --entrypoint sh "$image_id" -c '
      for dir in /home/um/logs/chat /home/um/logs/games /home/um/uploads; do
        [ -d "$dir" ] || exit 3
        [ -w "$dir" ] || exit 4
      done
    ' >/dev/null 2>&1
}

print_fix_commands() { # $1 = uid, $2 = gid
  echo
  echo "Run these on the host, then retry:"
  if (( ${#missing_dirs[@]} > 0 )); then
    echo "  sudo mkdir -p ${missing_dirs[*]}"
  fi
  echo "  sudo chown -R $1:$2 logs uploads"
}

if [[ "$running_uid" != "0" ]]; then
  if ! can_write "$running_uid" "${running_gid:-$running_uid}"; then
    echo
    echo "STOP: $container is running as uid $running_uid and cannot write its own data:"
    for dir in logs/chat logs/games uploads; do
      [[ -d "$dir" ]] || echo "  $dir is missing"
    done
    print_fix_commands "$running_uid" "${running_gid:-$running_uid}"
    echo
    echo "Nothing was restarted. The running site is untouched."
    exit 1
  fi
fi

if [[ "$target_uid" != "0" && "$target_uid" != "$running_uid" ]]; then
  if can_write "$target_uid" "$target_gid"; then
    echo "Deploy check: backend will run as uid $target_uid:$target_gid after the next rebuild; data directories are ready."
  else
    echo
    echo "NOTE: dockerfile declares USER $declared_user (uid $target_uid:$target_gid)."
    echo "The next backend rebuild will switch away from root, and the backend"
    echo "will then be unable to write logs/ and uploads/ unless they are owned"
    echo "by that uid."
    print_fix_commands "$target_uid" "$target_gid"
    echo
    echo "This update does not rebuild the backend, so nothing is broken now."
    echo "Do the above before your next backend build."
  fi
  exit 0
fi

echo "Deploy check: backend runs as uid ${running_uid}:${running_gid:-$running_uid}; data directories are writable."
exit 0
