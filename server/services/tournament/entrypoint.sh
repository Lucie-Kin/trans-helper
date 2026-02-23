#!/bin/sh
set -e

mkdir -p /app/data
chown -R node:node /app/data

sqlite3 /app/data/tournament.sqlite < /app/sql/schema.sql

exec su node -s /bin/sh -c "node /app/dist/app.js"