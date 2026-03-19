#!/usr/bin/env bash
# VCT Platform — Database Restore Script
# Usage: ./restore.sh <backup-file> [database-name]
#
# Restores a PostgreSQL backup from a .dump (pg_dump custom format)
# or .sql/.sql.gz (plain text) file.
#
# Environment variables:
#   DB_HOST       (default: localhost)
#   DB_PORT       (default: 5432)
#   DB_NAME       (default: vct_platform)
#   DB_USER       (default: vct_user)
#   DB_PASSWORD   (required)
#   CONTAINER     (default: vct-postgres — for Docker restore)

set -euo pipefail

# ── Args ─────────────────────────────────────────────────────
BACKUP_FILE="${1:-}"
DB_NAME_OVERRIDE="${2:-}"

if [ -z "${BACKUP_FILE}" ]; then
  echo "Usage: ./restore.sh <backup-file> [database-name]"
  echo ""
  echo "Supported formats: .dump (pg_restore), .sql, .sql.gz"
  echo ""
  echo "Examples:"
  echo "  ./restore.sh backups/vct_platform_20260319.dump"
  echo "  ./restore.sh backups/daily/vct_platform_20260319_020000.sql.gz"
  exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "❌ Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

# ── Config ───────────────────────────────────────────────────
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME_OVERRIDE:-${DB_NAME:-vct_platform}}"
DB_USER="${DB_USER:-vct_user}"
CONTAINER="${CONTAINER:-vct-postgres}"

FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
FILE_EXT="${BACKUP_FILE##*.}"

echo "=== VCT Platform — Database Restore ==="
echo "File:     ${BACKUP_FILE} (${FILE_SIZE})"
echo "Database: ${DB_NAME}@${DB_HOST}:${DB_PORT}"
echo "User:     ${DB_USER}"
echo ""

# ── Safety Prompt ────────────────────────────────────────────
echo "⚠️  WARNING: This will DROP existing data in '${DB_NAME}' and replace it."
read -r -p "Type 'yes' to continue: " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

echo ""
echo "Starting restore..."
START_TIME=$(date +%s)

# ── Restore ──────────────────────────────────────────────────
export PGPASSWORD="${DB_PASSWORD}"

case "${FILE_EXT}" in
  dump)
    echo "Format: pg_dump custom (using pg_restore)"
    if command -v docker &>/dev/null && docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
      echo "Restoring via Docker container: ${CONTAINER}"
      docker exec -i "${CONTAINER}" pg_restore \
        -U "${DB_USER}" \
        -d "${DB_NAME}" \
        --clean --if-exists \
        --no-owner --no-privileges \
        < "${BACKUP_FILE}"
    else
      pg_restore \
        -h "${DB_HOST}" -p "${DB_PORT}" \
        -U "${DB_USER}" -d "${DB_NAME}" \
        --clean --if-exists \
        --no-owner --no-privileges \
        "${BACKUP_FILE}"
    fi
    ;;
  sql)
    echo "Format: plain SQL"
    if command -v docker &>/dev/null && docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
      docker exec -i "${CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" < "${BACKUP_FILE}"
    else
      psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" < "${BACKUP_FILE}"
    fi
    ;;
  gz)
    echo "Format: gzipped SQL"
    if command -v docker &>/dev/null && docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
      gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}"
    else
      gunzip -c "${BACKUP_FILE}" | psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}"
    fi
    ;;
  *)
    echo "❌ Unsupported backup format: .${FILE_EXT}"
    echo "   Supported: .dump, .sql, .sql.gz"
    exit 1
    ;;
esac

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

echo ""
echo "=== Restore complete (${ELAPSED}s) ==="

# ── Verify ───────────────────────────────────────────────────
echo ""
echo "Verifying restore..."
if command -v docker &>/dev/null && docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  TABLE_COUNT=$(docker exec "${CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" -tAc \
    "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';")
else
  TABLE_COUNT=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -tAc \
    "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';")
fi

echo "✅ Tables in '${DB_NAME}': ${TABLE_COUNT}"
