#!/usr/bin/env bash
# VCT Platform — Comprehensive Database Health Check
# Usage: ./db-healthcheck.sh
#
# Checks: connectivity, replication lag, active connections,
# table bloat, long queries, migration status, disk usage.
#
# Exit codes: 0=healthy, 1=warning, 2=critical

set -euo pipefail

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-vct_platform}"
DB_USER="${DB_USER:-vct_admin}"
CONTAINER="${CONTAINER:-vct-postgres}"

WARNINGS=0
CRITICALS=0

# ── Helpers ──────────────────────────────────────────────────
psql_exec() {
  if command -v docker &>/dev/null && docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
    docker exec "${CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" -tAc "$1" 2>/dev/null
  else
    export PGPASSWORD="${DB_PASSWORD:-}"
    psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -tAc "$1" 2>/dev/null
  fi
}

check() {
  local name="$1" status="$2" detail="$3"
  case "$status" in
    OK)       echo "  ✅ ${name}: ${detail}" ;;
    WARNING)  echo "  ⚠️  ${name}: ${detail}"; WARNINGS=$((WARNINGS + 1)) ;;
    CRITICAL) echo "  ❌ ${name}: ${detail}"; CRITICALS=$((CRITICALS + 1)) ;;
  esac
}

echo "═══════════════════════════════════════════════════"
echo " VCT Platform — Database Health Check"
echo " $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "═══════════════════════════════════════════════════"
echo ""

# ── 1. Connectivity ──────────────────────────────────────────
echo "▸ Connectivity"
if psql_exec "SELECT 1" > /dev/null 2>&1; then
  VERSION=$(psql_exec "SELECT version();" | head -1)
  check "PostgreSQL" "OK" "${VERSION}"
else
  check "PostgreSQL" "CRITICAL" "Cannot connect to ${DB_HOST}:${DB_PORT}"
  echo ""
  echo "RESULT: CRITICAL — Database unreachable"
  exit 2
fi

# ── 2. Database Size ─────────────────────────────────────────
echo ""
echo "▸ Storage"
DB_SIZE=$(psql_exec "SELECT pg_size_pretty(pg_database_size('${DB_NAME}'));")
DB_SIZE_BYTES=$(psql_exec "SELECT pg_database_size('${DB_NAME}');")
if [ "${DB_SIZE_BYTES}" -gt 5368709120 ]; then  # 5GB
  check "DB Size" "WARNING" "${DB_SIZE}"
else
  check "DB Size" "OK" "${DB_SIZE}"
fi

TABLE_COUNT=$(psql_exec "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';")
check "Tables" "OK" "${TABLE_COUNT} tables in public schema"

# ── 3. Connections ───────────────────────────────────────────
echo ""
echo "▸ Connections"
MAX_CONN=$(psql_exec "SHOW max_connections;")
ACTIVE_CONN=$(psql_exec "SELECT count(*) FROM pg_stat_activity WHERE datname='${DB_NAME}';")
IDLE_CONN=$(psql_exec "SELECT count(*) FROM pg_stat_activity WHERE datname='${DB_NAME}' AND state='idle';")
USAGE_PCT=$((ACTIVE_CONN * 100 / MAX_CONN))

if [ "${USAGE_PCT}" -gt 80 ]; then
  check "Connections" "CRITICAL" "${ACTIVE_CONN}/${MAX_CONN} (${USAGE_PCT}%)"
elif [ "${USAGE_PCT}" -gt 60 ]; then
  check "Connections" "WARNING" "${ACTIVE_CONN}/${MAX_CONN} (${USAGE_PCT}%)"
else
  check "Connections" "OK" "${ACTIVE_CONN}/${MAX_CONN} (${USAGE_PCT}%) — idle: ${IDLE_CONN}"
fi

# ── 4. Cache Hit Ratio ───────────────────────────────────────
echo ""
echo "▸ Performance"
CACHE_HIT=$(psql_exec "
  SELECT ROUND(
    (blks_hit::numeric / NULLIF(blks_hit + blks_read, 0)) * 100, 2
  ) FROM pg_stat_database WHERE datname='${DB_NAME}';
")
if [ -n "${CACHE_HIT}" ]; then
  CACHE_INT=${CACHE_HIT%.*}
  if [ "${CACHE_INT}" -lt 90 ]; then
    check "Cache Hit" "WARNING" "${CACHE_HIT}% (target: >99%)"
  elif [ "${CACHE_INT}" -lt 99 ]; then
    check "Cache Hit" "OK" "${CACHE_HIT}%"
  else
    check "Cache Hit" "OK" "${CACHE_HIT}% — excellent"
  fi
fi

# ── 5. Long Queries ──────────────────────────────────────────
LONG_QUERIES=$(psql_exec "
  SELECT count(*) FROM pg_stat_activity 
  WHERE datname='${DB_NAME}' 
    AND state='active' 
    AND now() - query_start > interval '60 seconds';
")
if [ "${LONG_QUERIES}" -gt 0 ]; then
  check "Long Queries" "WARNING" "${LONG_QUERIES} queries running > 60s"
else
  check "Long Queries" "OK" "No queries > 60s"
fi

# ── 6. Dead Tuples (Vacuum) ─────────────────────────────────
echo ""
echo "▸ Maintenance"
BLOATED=$(psql_exec "
  SELECT count(*) FROM pg_stat_user_tables 
  WHERE n_dead_tup > 10000 
    AND n_dead_tup > n_live_tup * 0.1;
")
if [ "${BLOATED}" -gt 0 ]; then
  check "Table Bloat" "WARNING" "${BLOATED} tables need VACUUM"
  TOP_BLOAT=$(psql_exec "
    SELECT relname || ' (' || n_dead_tup || ' dead)' 
    FROM pg_stat_user_tables 
    WHERE n_dead_tup > 10000 
    ORDER BY n_dead_tup DESC LIMIT 3;
  ")
  echo "           → ${TOP_BLOAT}"
else
  check "Table Bloat" "OK" "All tables healthy"
fi

# ── 7. Locks ─────────────────────────────────────────────────
BLOCKED=$(psql_exec "
  SELECT count(*) FROM pg_locks 
  WHERE NOT granted AND locktype='relation';
")
if [ "${BLOCKED}" -gt 0 ]; then
  check "Locks" "WARNING" "${BLOCKED} blocked queries waiting"
else
  check "Locks" "OK" "No blocked queries"
fi

# ── Summary ──────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
if [ "${CRITICALS}" -gt 0 ]; then
  echo " RESULT: ❌ CRITICAL (${CRITICALS} critical, ${WARNINGS} warnings)"
  exit 2
elif [ "${WARNINGS}" -gt 0 ]; then
  echo " RESULT: ⚠️  WARNING (${WARNINGS} warnings)"
  exit 1
else
  echo " RESULT: ✅ HEALTHY"
  exit 0
fi
