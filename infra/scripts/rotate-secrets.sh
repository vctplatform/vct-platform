#!/usr/bin/env bash
# ════════════════════════════════════════
# VCT Platform — Secret Rotation Script
# Rotates DB password, JWT secret, and API keys
# Usage: ./infra/scripts/rotate-secrets.sh [--dry-run]
# ════════════════════════════════════════
set -euo pipefail

DRY_RUN="${1:-}"
PROJECT_ID="${GCP_PROJECT_ID:?GCP_PROJECT_ID is required}"
NAMESPACE="${K8S_NAMESPACE:-vct-production}"

log() { echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] $*"; }
die() { log "ERROR: $*" >&2; exit 1; }

# ── Generate secure random value ──────────
generate_secret() {
    local length="${1:-32}"
    openssl rand -base64 "$length" | tr -d '/+=' | head -c "$length"
}

# ── Rotate a GCP Secret Manager secret ────
rotate_gcp_secret() {
    local secret_name="$1"
    local new_value="$2"
    local description="${3:-Rotated by rotate-secrets.sh}"

    log "Rotating GCP secret: ${secret_name}"

    if [[ "$DRY_RUN" == "--dry-run" ]]; then
        log "  [DRY-RUN] Would set ${secret_name} = ${new_value:0:4}***"
        return
    fi

    # Add new version
    echo -n "$new_value" | gcloud secrets versions add "$secret_name" \
        --project="$PROJECT_ID" \
        --data-file=-

    # Disable old versions (keep last 2)
    local versions
    versions=$(gcloud secrets versions list "$secret_name" \
        --project="$PROJECT_ID" \
        --filter="state=ENABLED" \
        --sort-by="~createTime" \
        --format="value(name)" | tail -n +3)

    for v in $versions; do
        log "  Disabling old version: ${v}"
        gcloud secrets versions disable "$v" \
            --secret="$secret_name" \
            --project="$PROJECT_ID" --quiet
    done

    log "  ✅ ${secret_name} rotated"
}

# ── Main ──────────────────────────────────
main() {
    log "Starting secret rotation for project: ${PROJECT_ID}"
    log "Namespace: ${NAMESPACE}"
    [[ "$DRY_RUN" == "--dry-run" ]] && log "⚡ DRY-RUN MODE — no changes will be made"

    # 1. Rotate database password
    local new_db_password
    new_db_password=$(generate_secret 40)
    rotate_gcp_secret "vct-postgres-password" "$new_db_password" "DB password rotation"

    # 2. Rotate JWT secret
    local new_jwt_secret
    new_jwt_secret=$(generate_secret 64)
    rotate_gcp_secret "vct-jwt-secret" "$new_jwt_secret" "JWT secret rotation"

    # 3. Rotate encryption key
    local new_enc_key
    new_enc_key=$(generate_secret 32)
    rotate_gcp_secret "vct-encryption-key" "$new_enc_key" "Encryption key rotation"

    # 4. Trigger External Secrets refresh
    if [[ "$DRY_RUN" != "--dry-run" ]]; then
        log "Triggering External Secrets refresh..."
        kubectl annotate externalsecret vct-database-secrets \
            -n "$NAMESPACE" \
            force-sync="$(date +%s)" --overwrite 2>/dev/null || true
        kubectl annotate externalsecret vct-app-secrets \
            -n "$NAMESPACE" \
            force-sync="$(date +%s)" --overwrite 2>/dev/null || true
    fi

    # 5. Rolling restart API pods to pick up new secrets
    if [[ "$DRY_RUN" != "--dry-run" ]]; then
        log "Rolling restart API pods..."
        kubectl rollout restart deployment/vct-api -n "$NAMESPACE"
        kubectl rollout status deployment/vct-api -n "$NAMESPACE" --timeout=120s
    fi

    log "═══════════════════════════════════"
    log "✅ Secret rotation complete"
    log "═══════════════════════════════════"
}

main
