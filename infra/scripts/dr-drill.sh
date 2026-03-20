#!/usr/bin/env bash
# ════════════════════════════════════════
# VCT Platform — Disaster Recovery Drill
# Simulates full DR scenario: backup → restore → validate
# Usage: ./infra/scripts/dr-drill.sh [--target staging|production]
# ════════════════════════════════════════
set -euo pipefail

TARGET="${2:-staging}"
NAMESPACE="vct-${TARGET}"
TIMESTAMP=$(date -u +%Y%m%d_%H%M%S)
LOG_FILE="/tmp/dr-drill-${TIMESTAMP}.log"

log() { echo "[$(date -u +'%H:%M:%S')] $*" | tee -a "$LOG_FILE"; }
die() { log "❌ FAILED: $*"; exit 1; }

log "════════════════════════════════════════"
log "  VCT Platform — DR Drill"
log "  Target: ${TARGET}"
log "  Started: $(date -u)"
log "════════════════════════════════════════"

# ── Step 1: Verify current backup exists ──
log ""
log "📋 Step 1: Checking latest backup..."
LATEST_BACKUP=$(gsutil ls "gs://vct-platform-backups/dumps/" 2>/dev/null | sort -r | head -1)
[[ -z "$LATEST_BACKUP" ]] && die "No backups found in GCS"
log "  Latest backup: ${LATEST_BACKUP}"

BACKUP_AGE=$(( ($(date +%s) - $(gsutil stat "$LATEST_BACKUP" | grep "Update time" | awk '{print $3, $4, $5}' | date -f - +%s 2>/dev/null || echo $(date +%s))) / 3600 ))
log "  Backup age: ${BACKUP_AGE}h"
[[ $BACKUP_AGE -gt 48 ]] && log "  ⚠️  WARNING: Backup is older than 48 hours!"

# ── Step 2: Download backup ───────────────
log ""
log "📥 Step 2: Downloading backup..."
gsutil cp "$LATEST_BACKUP" "/tmp/dr-drill-backup.sql.gz"
BACKUP_SIZE=$(du -h "/tmp/dr-drill-backup.sql.gz" | cut -f1)
log "  Downloaded: ${BACKUP_SIZE}"

# ── Step 3: Create temporary restore DB ───
log ""
log "🗄️  Step 3: Creating temporary database..."
DR_DB="vct_dr_drill_${TIMESTAMP}"
PGHOST=${PGHOST:-vct-postgres}
PGUSER=${PGUSER:-vct_user}

createdb -h "$PGHOST" -U "$PGUSER" "$DR_DB" || die "Failed to create temp DB"
log "  Created: ${DR_DB}"

# ── Step 4: Restore backup ───────────────
log ""
log "🔄 Step 4: Restoring backup..."
RESTORE_START=$(date +%s)
gunzip -c "/tmp/dr-drill-backup.sql.gz" | pg_restore -h "$PGHOST" -U "$PGUSER" \
  -d "$DR_DB" --no-owner --clean --if-exists 2>/dev/null || true
RESTORE_DURATION=$(( $(date +%s) - RESTORE_START ))
log "  Restore completed in ${RESTORE_DURATION}s"

# ── Step 5: Validate data integrity ──────
log ""
log "✅ Step 5: Validating data integrity..."
ERRORS=0

validate_table() {
  local table=$1
  local min_count=${2:-0}
  local count
  count=$(psql -h "$PGHOST" -U "$PGUSER" -d "$DR_DB" -t -c \
    "SELECT COUNT(*) FROM ${table}" 2>/dev/null | tr -d ' ')

  if [[ -z "$count" || "$count" == "" ]]; then
    log "  ❌ ${table}: TABLE MISSING"
    ERRORS=$((ERRORS + 1))
  elif [[ "$count" -lt "$min_count" ]]; then
    log "  ⚠️  ${table}: ${count} rows (expected >= ${min_count})"
    ERRORS=$((ERRORS + 1))
  else
    log "  ✅ ${table}: ${count} rows"
  fi
}

validate_table "users" 1
validate_table "athletes" 0
validate_table "tournaments" 0
validate_table "clubs" 0
validate_table "categories" 0
validate_table "matches" 0
validate_table "scores" 0

# Check schema version
SCHEMA_VER=$(psql -h "$PGHOST" -U "$PGUSER" -d "$DR_DB" -t -c \
  "SELECT MAX(version) FROM schema_migrations" 2>/dev/null | tr -d ' ' || echo "unknown")
log "  📌 Schema version: ${SCHEMA_VER}"

# ── Step 6: Performance test on restored DB ──
log ""
log "⏱️  Step 6: Performance spot-check..."
QUERY_TIME=$(psql -h "$PGHOST" -U "$PGUSER" -d "$DR_DB" -c \
  "\\timing on" -c "SELECT COUNT(*) FROM users" 2>&1 | grep "Time:" | awk '{print $2}')
log "  Query time: ${QUERY_TIME:-N/A}ms"

# ── Step 7: Cleanup ──────────────────────
log ""
log "🧹 Step 7: Cleaning up..."
dropdb -h "$PGHOST" -U "$PGUSER" "$DR_DB" 2>/dev/null || true
rm -f "/tmp/dr-drill-backup.sql.gz"
log "  Temp DB and files removed"

# ── Summary ──────────────────────────────
log ""
log "════════════════════════════════════════"
if [[ $ERRORS -eq 0 ]]; then
  log "  ✅ DR DRILL PASSED"
  log "  Restore time: ${RESTORE_DURATION}s"
  log "  All ${#TABLES[@]} tables validated"
else
  log "  ⚠️  DR DRILL COMPLETED WITH ${ERRORS} WARNINGS"
fi
log "  Log: ${LOG_FILE}"
log "════════════════════════════════════════"

exit $ERRORS
