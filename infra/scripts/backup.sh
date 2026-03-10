#!/usr/bin/env bash
# VCT Platform - PostgreSQL Backup Script
# Usage: ./backup.sh
# 
# Environment variables:
#   DB_HOST     (default: localhost)
#   DB_PORT     (default: 5432)
#   DB_NAME     (default: vct_platform)
#   DB_USER     (default: vct_user)
#   DB_PASSWORD (required)
#   BACKUP_DIR  (default: /backups)
#   RETAIN_DAILY  (default: 7 - keep last 7 daily backups)
#   RETAIN_WEEKLY (default: 4 - keep last 4 weekly backups)

set -euo pipefail

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-vct_platform}"
DB_USER="${DB_USER:-vct_user}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETAIN_DAILY="${RETAIN_DAILY:-7}"
RETAIN_WEEKLY="${RETAIN_WEEKLY:-4}"

# Derived
DATE=$(date +%Y-%m-%d_%H-%M-%S)
DOW=$(date +%u)  # day of week (1=Monday)
DAILY_DIR="${BACKUP_DIR}/daily"
WEEKLY_DIR="${BACKUP_DIR}/weekly"

# Create directories
mkdir -p "${DAILY_DIR}" "${WEEKLY_DIR}"

echo "=== VCT Platform Database Backup ==="
echo "Date:     ${DATE}"
echo "Database: ${DB_NAME}@${DB_HOST}:${DB_PORT}"

# Perform backup
BACKUP_FILE="${DAILY_DIR}/${DB_NAME}_${DATE}.sql.gz"
export PGPASSWORD="${DB_PASSWORD}"

pg_dump \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --format=custom \
  --compress=6 \
  --verbose \
  2>/dev/null \
  | gzip > "${BACKUP_FILE}"

echo "Backup created: ${BACKUP_FILE}"
echo "Size: $(du -h "${BACKUP_FILE}" | cut -f1)"

# Weekly backup (copy Sunday's backup)
if [ "${DOW}" -eq 7 ]; then
  WEEKLY_FILE="${WEEKLY_DIR}/${DB_NAME}_weekly_${DATE}.sql.gz"
  cp "${BACKUP_FILE}" "${WEEKLY_FILE}"
  echo "Weekly backup saved: ${WEEKLY_FILE}"
fi

# Cleanup old daily backups
echo "Cleaning up daily backups older than ${RETAIN_DAILY} days..."
find "${DAILY_DIR}" -name "*.sql.gz" -mtime "+${RETAIN_DAILY}" -delete 2>/dev/null || true

# Cleanup old weekly backups
echo "Cleaning up weekly backups older than ${RETAIN_WEEKLY} weeks..."
find "${WEEKLY_DIR}" -name "*.sql.gz" -mtime "+$((RETAIN_WEEKLY * 7))" -delete 2>/dev/null || true

echo "=== Backup complete ==="
echo "Daily backups:  $(ls -1 "${DAILY_DIR}"/*.sql.gz 2>/dev/null | wc -l)"
echo "Weekly backups: $(ls -1 "${WEEKLY_DIR}"/*.sql.gz 2>/dev/null | wc -l)"
