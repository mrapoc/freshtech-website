#!/usr/bin/env bash
set -euo pipefail

archive_path=${1:?source archive path required}
job_root=${2:?unique job directory required}
job_started_epoch=$(date +%s)
lock_dir="$HOME/.heavy-job-lock"
lock_info="$lock_dir/info"

if ! mkdir "$lock_dir" 2>/dev/null; then
  echo "Shared worker is busy" >&2
  exit 73
fi

cleanup_lock() {
  if [[ -f "$lock_info" ]] && grep -q "pid=$$" "$lock_info"; then
    rm "$lock_info"
    rmdir "$lock_dir"
  fi
}
trap cleanup_lock EXIT INT TERM

printf 'task=freshtech-html-first-slice\nstart=%s\npid=%s\n' "$(date -u +%FT%TZ)" "$$" > "$lock_info"
if [[ -e "$job_root" ]]; then
  echo "Refusing to reuse existing job directory: $job_root" >&2
  exit 74
fi
mkdir "$job_root"
tar -xf "$archive_path" -C "$job_root"

export PATH="$HOME/.local/bin:$PATH"
export NODE_OPTIONS=--max-old-space-size=4096
export ASTRO_TELEMETRY_DISABLED=1
prototype="$job_root/prototypes/html-first-slice"
: "${PLAYWRIGHT_MODULE:?set PLAYWRIGHT_MODULE from the private worker profile}"
: "${PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH:?set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH from the private worker profile}"

taskset -c 0-3 npm --prefix "$prototype" ci --ignore-scripts
taskset -c 0-3 npm --prefix "$prototype" test
taskset -c 0-3 npm --prefix "$prototype" run test:consent
taskset -c 0-3 npm --prefix "$prototype" run test:pricing
taskset -c 0-3 npm --prefix "$prototype" run build
taskset -c 0-3 npm --prefix "$prototype" run verify:browser
taskset -c 0-3 npm --prefix "$prototype" run verify:pricing-browser
taskset -c 0-3 npm --prefix "$prototype" run verify:fonts
taskset -c 0-3 npm --prefix "$prototype" run verify:consent-browser
taskset -c 0-3 npm --prefix "$prototype" run verify:consent-ui
taskset -c 0-3 npm --prefix "$prototype" run verify:case-studies-browser
cp "$prototype/dist/services/managed-it-support/index.html" "$prototype/evidence/managed-it-support.html"
cp "$prototype/dist/services/index.html" "$prototype/evidence/services-index.html"

{
  node --version
  npm --version
  printf 'source_sha256='
  sha256sum "$archive_path" | cut -d' ' -f1
  printf 'wall_seconds=%s\n' "$(( $(date +%s) - job_started_epoch ))"
} > "$prototype/evidence/worker-runtime.txt"
