#!/usr/bin/env bash
set -euo pipefail

# charge .env
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
set -a
. "$ROOT_DIR/.env"
set +a

STATUS_URL="${KIBANA_URL%/}/api/status"
IMPORT_URL="${KIBANA_URL%/}/api/saved_objects/_find?type=dashboard&per_page=1"

echo "Waiting for Kibana at $STATUS_URL ..."

for i in {1..120}; do
  #  status doit repondre
  if curl $CURL_OPTS -u "$KIBANA_USER:$KIBANA_PASS" -sS "$STATUS_URL" >/dev/null 2>&1; then
    # endpoint Saved Objects doit répondre (200/401/403) mais pas 502
    code="$(curl $CURL_OPTS -u "$KIBANA_USER:$KIBANA_PASS" -sS -o /dev/null -w "%{http_code}" "$IMPORT_URL" || true)"
    if [[ "$code" == "200" || "$code" == "401" || "$code" == "403" ]]; then
      echo "Kibana OK"
      exit 0
    fi
  fi

  sleep 2
done

echo "Kibana not ready after timeout"
exit 1
