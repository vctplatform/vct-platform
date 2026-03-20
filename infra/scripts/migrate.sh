#!/usr/bin/env bash
# VCT Platform — Database Migration Runner
# Runs pending migrations before the API starts
#
# Usage: ./migrate.sh
# Environment: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD

set -euo pipefail

DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-vct_platform}"
DB_USER="${DB_USER:-vct_user}"
MAX_RETRIES="${MAX_RETRIES:-30}"
RETRY_INTERVAL="${RETRY_INTERVAL:-2}"

echo "═══════════════════════════════════════"
echo "  VCT Database Migration Runner"
echo "═══════════════════════════════════════"
echo ""

# ── Wait for PostgreSQL ──────────────────────────────────────
echo "Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
retries=0
until pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" > /dev/null 2>&1; do
    retries=$((retries + 1))
    if [ "${retries}" -ge "${MAX_RETRIES}" ]; then
        echo "❌ FATAL: PostgreSQL not ready after ${MAX_RETRIES} retries"
        exit 1
    fi
    echo "  Attempt ${retries}/${MAX_RETRIES}..."
    sleep "${RETRY_INTERVAL}"
done
echo "✅ PostgreSQL is ready"
echo ""

# ── Check for migration files ────────────────────────────────
MIGRATION_DIR="${MIGRATION_DIR:-/migrations}"

if [ ! -d "${MIGRATION_DIR}" ]; then
    echo "⚠️  No migration directory found at ${MIGRATION_DIR}"
    echo "   Skipping migrations."
    exit 0
fi

MIGRATION_COUNT=$(find "${MIGRATION_DIR}" -name "*.sql" -type f 2>/dev/null | wc -l)
if [ "${MIGRATION_COUNT}" -eq 0 ]; then
    echo "⚠️  No .sql migration files found"
    exit 0
fi

echo "Found ${MIGRATION_COUNT} migration file(s)"

# ── Create migration tracking table ──────────────────────────
export PGPASSWORD="${DB_PASSWORD}"
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -q <<'EOF'
CREATE TABLE IF NOT EXISTS _migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) UNIQUE NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    checksum VARCHAR(64) NOT NULL
);
EOF
echo "✅ Migration tracking table ready"

# ── Run pending migrations (sorted by filename) ─────────────
APPLIED=0
SKIPPED=0

for migration_file in $(find "${MIGRATION_DIR}" -name "*.sql" -type f | sort); do
    filename=$(basename "${migration_file}")
    checksum=$(sha256sum "${migration_file}" | cut -d' ' -f1)

    # Check if already applied
    existing=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -tAc \
        "SELECT checksum FROM _migrations WHERE filename = '${filename}'")

    if [ -n "${existing}" ]; then
        if [ "${existing}" = "${checksum}" ]; then
            SKIPPED=$((SKIPPED + 1))
            continue
        else
            echo "⚠️  WARNING: ${filename} has changed since last apply!"
            echo "   Old checksum: ${existing}"
            echo "   New checksum: ${checksum}"
            echo "   Skipping (manual intervention required)"
            continue
        fi
    fi

    echo "  → Applying: ${filename}"
    if psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -f "${migration_file}" > /dev/null 2>&1; then
        psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -q -c \
            "INSERT INTO _migrations (filename, checksum) VALUES ('${filename}', '${checksum}')"
        APPLIED=$((APPLIED + 1))
    else
        echo "❌ FAILED: ${filename}"
        exit 1
    fi
done

echo ""
echo "═══════════════════════════════════════"
echo "  Applied: ${APPLIED}  Skipped: ${SKIPPED}"
echo "═══════════════════════════════════════"
