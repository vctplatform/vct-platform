#!/usr/bin/env bash
# VCT Platform — Backup Verification Script
# Verifies the integrity of the most recent database backup
#
# Usage: ./backup-verify.sh [backup_dir]

set -euo pipefail

BACKUP_DIR="${1:-/backups/daily}"
MIN_SIZE_KB=10  # Minimum acceptable backup size in KB

echo "═══════════════════════════════════════"
echo "  VCT Backup Verification"
echo "═══════════════════════════════════════"
echo ""

# Find latest backup
LATEST=$(ls -1t "${BACKUP_DIR}"/*.sql.gz 2>/dev/null | head -1)

if [ -z "${LATEST}" ]; then
    echo "❌ CRITICAL: No backup files found in ${BACKUP_DIR}"
    exit 2
fi

echo "Latest backup: $(basename "${LATEST}")"
echo "Path:          ${LATEST}"
echo "Date:          $(stat -c '%y' "${LATEST}" 2>/dev/null || stat -f '%Sm' "${LATEST}" 2>/dev/null || echo 'unknown')"
echo ""

ERRORS=0

# ── Check 1: File exists and is not empty ──
FILE_SIZE=$(stat -c '%s' "${LATEST}" 2>/dev/null || stat -f '%z' "${LATEST}" 2>/dev/null)
FILE_SIZE_KB=$((FILE_SIZE / 1024))
echo "Check 1: File size"
if [ "${FILE_SIZE_KB}" -lt "${MIN_SIZE_KB}" ]; then
    echo "  ❌ FAIL — ${FILE_SIZE_KB}KB (minimum: ${MIN_SIZE_KB}KB)"
    ERRORS=$((ERRORS + 1))
else
    echo "  ✅ PASS — ${FILE_SIZE_KB}KB"
fi

# ── Check 2: Valid gzip ──
echo "Check 2: Gzip integrity"
if gzip -t "${LATEST}" 2>/dev/null; then
    echo "  ✅ PASS — Valid gzip archive"
else
    echo "  ❌ FAIL — Corrupt gzip file"
    ERRORS=$((ERRORS + 1))
fi

# ── Check 3: Contains SQL data ──
echo "Check 3: SQL content"
FIRST_BYTES=$(gunzip -c "${LATEST}" 2>/dev/null | head -c 200 || true)
if echo "${FIRST_BYTES}" | grep -qiE '(pg_dump|PGDMP|CREATE|INSERT|COPY|SET)'; then
    echo "  ✅ PASS — Contains valid PostgreSQL dump data"
else
    echo "  ⚠️  WARN — Could not verify SQL content (may be custom format)"
fi

# ── Check 4: Backup age ──
echo "Check 4: Backup freshness"
FILE_AGE_HOURS=$(( ($(date +%s) - $(stat -c '%Y' "${LATEST}" 2>/dev/null || date -r "${LATEST}" +%s 2>/dev/null || echo 0)) / 3600 ))
if [ "${FILE_AGE_HOURS}" -gt 48 ]; then
    echo "  ⚠️  WARN — Backup is ${FILE_AGE_HOURS} hours old (> 48h)"
elif [ "${FILE_AGE_HOURS}" -gt 24 ]; then
    echo "  ⚠️  WARN — Backup is ${FILE_AGE_HOURS} hours old (> 24h)"
else
    echo "  ✅ PASS — ${FILE_AGE_HOURS} hours old"
fi

# ── Check 5: Backup count ──
echo "Check 5: Backup inventory"
DAILY_COUNT=$(ls -1 "${BACKUP_DIR}"/*.sql.gz 2>/dev/null | wc -l)
WEEKLY_DIR="${BACKUP_DIR}/../weekly"
WEEKLY_COUNT=$(ls -1 "${WEEKLY_DIR}"/*.sql.gz 2>/dev/null | wc -l || echo 0)
echo "  Daily:  ${DAILY_COUNT} backups"
echo "  Weekly: ${WEEKLY_COUNT} backups"

# ── Summary ──
echo ""
echo "═══════════════════════════════════════"
if [ "${ERRORS}" -gt 0 ]; then
    echo "  ❌ FAILED — ${ERRORS} check(s) failed"
    exit 2
else
    echo "  ✅ ALL CHECKS PASSED"
    exit 0
fi
