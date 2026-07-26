#!/bin/bash
# Nightly Postgres backup for Tap N Track. Keeps the last 14 gzipped dumps.
# Wired via cron (see crontab). Restore: gunzip -c <file>.sql.gz | psql "$DATABASE_URL"
set -euo pipefail
BACKUP_DIR="/home/topher/backups/tapntrack"
mkdir -p "$BACKUP_DIR"
# shellcheck disable=SC2046
export $(grep -E '^DATABASE_URL=' /home/topher/Projects/tapntrack/server/.env | xargs)
TS=$(date +%Y%m%d-%H%M%S)
pg_dump "$DATABASE_URL" | gzip > "$BACKUP_DIR/tapntrack-$TS.sql.gz"
# prune all but the newest 14
ls -1t "$BACKUP_DIR"/tapntrack-*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm -f
echo "backup written: $BACKUP_DIR/tapntrack-$TS.sql.gz"
