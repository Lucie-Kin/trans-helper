#!/usr/bin/env bash
set -euo pipefail


# repo_root/ELK/kibana/scripts/import_shared_objects.sh -> repo_root
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/../../.." && pwd)"

ENV_FILE="${REPO_ROOT}/.env"

# safe loader: only accepts KEY=VALUE lines, ignores comments & blank lines.
load_env_safe() {
  local f="$1"
  if [[ ! -f "$f" ]]; then
    echo "ERROR: .env not found at: $f" >&2
    exit 1
  fi

  while IFS= read -r line || [[ -n "$line" ]]; do
    # trim leading/trailing spaces
    line="${line#"${line%%[![:space:]]*}"}"
    line="${line%"${line##*[![:space:]]}"}"

    # skip blank lines and comments
    [[ -z "$line" ]] && continue
    [[ "${line:0:1}" == "#" ]] && continue

    # accept only KEY=VALUE (KEY must be shell-safe identifier)
    if [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
      # export as-is (VALUE may contain =)
      export "$line"
    else
      # ignore anything else to avoid "admin: command not found" issues
      continue
    fi
  done < "$f"
}

load_env_safe "$ENV_FILE"

# required vars (from .env)
: "${KIBANA_URL:?Missing KIBANA_URL in .env}"
: "${KIBANA_USER:?Missing KIBANA_USER in .env}"
: "${KIBANA_PASS:?Missing KIBANA_PASS in .env}"
: "${KIBANA_SPACE:=default}"
: "${KIBANA_EXPORT_FILE:?Missing KIBANA_EXPORT_FILE in .env}"

# optional curl flags (tls + insecure)
CURL_OPTS="${CURL_OPTS:--sk}"

# kibana saved objects import endpoint
IMPORT_URL="${KIBANA_URL}/s/${KIBANA_SPACE}/api/saved_objects/_import?overwrite=true"

if [[ ! -f "$REPO_ROOT/${KIBANA_EXPORT_FILE#./}" && ! -f "$KIBANA_EXPORT_FILE" ]]; then
  # support either relative-to-repo or already-relative paths
  # if file doesn't exist, we skip import without failing the whole make.
  echo "INFO: Saved objects file not found: $KIBANA_EXPORT_FILE"
  echo "INFO: Skipping Kibana import."
  exit 0
fi

# normalize path: if KIBANA_EXPORT_FILE is relative, resolve from repo root
NDJSON_PATH="$KIBANA_EXPORT_FILE"
if [[ "$NDJSON_PATH" != /* ]]; then
  # relative path
  if [[ -f "$REPO_ROOT/$NDJSON_PATH" ]]; then
    NDJSON_PATH="$REPO_ROOT/$NDJSON_PATH"
  fi
fi

echo "Importing Kibana saved objects..."
echo "  Kibana:   $KIBANA_URL"
echo "  Space:    $KIBANA_SPACE"
echo "  File:     $NDJSON_PATH"

# wait until Kibana is reachable
for i in {1..60}; do
  if curl $CURL_OPTS -u "${KIBANA_USER}:${KIBANA_PASS}" \
      -sS "${KIBANA_URL}/api/status" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

# import
curl $CURL_OPTS -u "${KIBANA_USER}:${KIBANA_PASS}" \
  -sS -X POST "$IMPORT_URL" \
  -H "kbn-xsrf: true" \
  -F "file=@${NDJSON_PATH}" \
  | sed -e 's/"errors":\[/\n"errors":[/g'

echo "Done."
