#!/bin/sh
set -e
npx tsc
cp -r src/public dist
exec node dist/app.js