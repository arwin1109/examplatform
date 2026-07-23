#!/bin/sh
set -e

echo "Running storage & database deployment checks..."
node scripts/init-db.js

exec "$@"
