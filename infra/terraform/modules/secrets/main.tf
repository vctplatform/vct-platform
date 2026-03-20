# ════════════════════════════════════════
# Terraform — GCP Secret Manager Module
# ════════════════════════════════════════

variable "project_id"  { type = string }
variable "environment" { type = string }
variable "labels"      { type = map(string) }

locals {
  secrets = [
    "vct-postgres-user",
    "vct-postgres-password",
    "vct-postgres-database",
    "vct-jwt-secret",
    "vct-redis-password",
    "vct-nats-token",
    "vct-minio-access-key",
    "vct-minio-secret-key",
    "vct-encryption-key",
  ]
}

# ── Enable Secret Manager API ─────────────
resource "google_project_service" "secretmanager" {
  service            = "secretmanager.googleapis.com"
  disable_on_destroy = false
}

# ── Create secrets ────────────────────────
resource "google_secret_manager_secret" "secrets" {
  for_each  = toset(local.secrets)
  secret_id = each.key
  project   = var.project_id

  replication {
    auto {}
  }

  labels = merge(var.labels, {
    secret_name = each.key
  })

  # Rotation reminder (90 days)
  rotation {
    rotation_period = "7776000s"  # 90 days
  }

  depends_on = [google_project_service.secretmanager]
}

# ── IAM — External Secrets SA access ─────
resource "google_service_account" "external_secrets" {
  account_id   = "external-secrets"
  display_name = "External Secrets Operator"
  project      = var.project_id
}

resource "google_secret_manager_secret_iam_member" "accessor" {
  for_each  = toset(local.secrets)
  secret_id = google_secret_manager_secret.secrets[each.key].secret_id
  project   = var.project_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.external_secrets.email}"
}

# ── Workload Identity binding ─────────────
resource "google_service_account_iam_member" "workload_identity" {
  service_account_id = google_service_account.external_secrets.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[vct-${var.environment}/external-secrets-sa]"
}

# ── Outputs ───────────────────────────────
output "secret_names"           { value = [for s in google_secret_manager_secret.secrets : s.secret_id] }
output "service_account_email"  { value = google_service_account.external_secrets.email }
