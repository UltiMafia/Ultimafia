#!/usr/bin/bash
#
# Remove local build artifacts for this checkout only.
#
# This never stops containers, never removes images or networks, and never
# touches Docker volumes. It also leaves the npm lockfiles alone: they are
# tracked in git, and `npm install` regenerating them is not cleanup.
#
# Usage:
#   bash cleanup.sh                  show the plan, then ask before deleting
#   bash cleanup.sh --yes            skip the confirmation prompt
#   bash cleanup.sh --dry-run        print the plan, change nothing
#   bash cleanup.sh --docker-garbage also remove dangling images and unused
#                                    anonymous volumes (never named volumes)

set -euo pipefail

project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$project_dir"

assume_yes=false
dry_run=false
docker_garbage=false

for arg in "$@"; do
  case "$arg" in
    --yes) assume_yes=true ;;
    --dry-run) dry_run=true ;;
    --docker-garbage) docker_garbage=true ;;
    -h|--help)
      awk 'NR > 1 && /^#/ { sub(/^# ?/, ""); print; next } NR > 1 { exit }' "${BASH_SOURCE[0]}"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg" >&2
      echo "Try: bash cleanup.sh --help" >&2
      exit 2
      ;;
  esac
done

# Only build output and dependency trees this checkout owns. Nothing outside
# project_dir is ever removed.
targets=(
  "node_modules"
  "react_main/node_modules"
  "react_main/build_public"
)

echo "Project: $project_dir"
echo

existing=()
for target in "${targets[@]}"; do
  if [[ -e "$target" ]]; then
    existing+=("$target")
  fi
done

if (( ${#existing[@]} == 0 )); then
  echo "Nothing to remove."
else
  echo "Will remove:"
  for target in "${existing[@]}"; do
    size="$(du -sh -- "$target" 2>/dev/null | cut -f1 || echo '?')"
    printf '  %-32s %s\n' "$target" "$size"
  done
fi

if $docker_garbage; then
  echo
  echo "Docker garbage (dangling images and unused anonymous volumes only):"
  if ! docker info >/dev/null 2>&1; then
    echo "  Docker is not running; skipping."
    docker_garbage=false
  else
    anonymous=0
    while IFS= read -r name; do
      if [[ "$name" =~ ^[0-9a-f]{64}$ ]]; then
        anonymous=$((anonymous + 1))
      fi
    done < <(docker volume ls -q || true)
    dangling="$(docker image ls -qf dangling=true | wc -l)"
    echo "  dangling images: ${dangling}"
    echo "  anonymous volumes: ${anonymous} total (only unused ones are pruned)"
  fi
fi

if $dry_run; then
  echo
  echo "Dry run: nothing changed."
  exit 0
fi

if (( ${#existing[@]} > 0 )) && ! $assume_yes; then
  echo
  read -r -p "Delete the paths listed above? Type 'yes' to continue: " reply
  if [[ "$reply" != "yes" ]]; then
    echo "Aborted; nothing was removed."
    exit 1
  fi
fi

for target in "${existing[@]}"; do
  echo "Removing $target"
  if ! rm -rf -- "$target" 2>/dev/null; then
    echo "Could not remove $target: some files are owned by another user," >&2
    echo "usually root because the containers write into this checkout." >&2
    echo "Fix the ownership for this path only, then rerun:" >&2
    echo "  sudo chown -R $(id -u):$(id -g) \"$project_dir/$target\"" >&2
    exit 1
  fi
done

if $docker_garbage; then
  echo "Pruning dangling images"
  docker image prune -f
  echo "Pruning unused anonymous volumes"
  # No --all: named volumes such as ultimafia_mongodb are never candidates.
  docker volume prune -f
fi

echo "Done."
