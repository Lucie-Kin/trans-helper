#!/bin/sh
set -eu

ES_URL="${ES_URL:-http://elasticsearch:9200}"
POLICY_FILE="/policies/ilm-logs-retention-7d.json"
TEMPLATE_FILE="/policies/index-template-ft-logs.json"

echo "[es-init] Waiting for Elasticsearch at $ES_URL ..."
until curl -fsS "$ES_URL" >/dev/null 2>&1; do
  echo "[es-init] still waiting..."
  sleep 1
done

# Vérifications fichiers 
if [ ! -r "$POLICY_FILE" ]; then
  echo "[es-init] ERROR: cannot read $POLICY_FILE"
  ls -la /policies || true
  exit 1
fi

if [ ! -r "$TEMPLATE_FILE" ]; then
  echo "[es-init] ERROR: cannot read $TEMPLATE_FILE"
  ls -la /policies || true
  exit 1
fi

echo "[es-init] Elasticsearch is up. Applying ILM policy..."
curl -fsS -X PUT "$ES_URL/_ilm/policy/logs-retention-7d" \
  -H "Content-Type: application/json" \
  --data-binary @"$POLICY_FILE" >/dev/null

echo "[es-init] Applying index template..."
curl -fsS -X PUT "$ES_URL/_index_template/ft-transcendance-logs-template" \
  -H "Content-Type: application/json" \
  --data-binary @"$TEMPLATE_FILE" >/dev/null


echo "[es-init] Done."
