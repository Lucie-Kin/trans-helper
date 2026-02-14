#!/usr/bin/env bash
set -euo pipefail

load_env() {
  local env_file="$1"
  [[ -f "$env_file" ]] || { echo "Missing .env: $env_file" >&2; exit 1; }

  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    [[ "$line" =~ ^[[:space:]]*$ ]] && continue
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    if [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
      export "$line"
    fi
  done < "$env_file"
}

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

load_env "$ENV_FILE"

: "${KIBANA_URL:?Missing KIBANA_URL in .env}"
: "${KIBANA_USER:?Missing KIBANA_USER in .env}"
: "${KIBANA_PASS:?Missing KIBANA_PASS in .env}"
: "${KIBANA_EXPORT_FILE:?Missing KIBANA_EXPORT_FILE in .env}"

KIBANA_SPACE="${KIBANA_SPACE:-default}"
CURL_OPTS="${CURL_OPTS:--sk}"

BASE="${KIBANA_URL%/}"
if [[ -n "$KIBANA_SPACE" && "$KIBANA_SPACE" != "default" ]]; then
  API_BASE="${BASE}/s/${KIBANA_SPACE}"
else
  API_BASE="${BASE}"
fi

mkdir -p "$(dirname "$KIBANA_EXPORT_FILE")"

NETRC="$(mktemp)"
chmod 600 "$NETRC"
cat > "$NETRC" <<EOF
machine localhost
login ${KIBANA_USER}
password ${KIBANA_PASS}
EOF
trap 'rm -f "$NETRC"' EXIT

curl $CURL_OPTS --fail-with-body --netrc-file "$NETRC" \
  -H 'kbn-xsrf: true' \
  -H 'Content-Type: application/json' \
  -X POST "${API_BASE}/api/saved_objects/_export" \
  -d '{
    "type": ["dashboard", "visualization", "search", "index-pattern"],
    "includeReferencesDeep": true
  }' \
  -o "$KIBANA_EXPORT_FILE"

echo "Export OK -> $KIBANA_EXPORT_FILE"
