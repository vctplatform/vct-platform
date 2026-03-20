# ════════════════════════════════════════
# DNS Module — Cloud DNS + SSL
# ════════════════════════════════════════

variable "domain"      { type = string }
variable "project_id"  { type = string }
variable "environment" { type = string }
variable "labels"      { type = map(string) }

# ── Managed Zone ──────────────────────────
resource "google_dns_managed_zone" "main" {
  count       = var.environment == "production" ? 1 : 0
  name        = "vct-platform-zone"
  project     = var.project_id
  dns_name    = "${var.domain}."
  description = "VCT Platform DNS zone"
  labels      = var.labels
}

# ── Managed SSL Certificate ──────────────
resource "google_compute_managed_ssl_certificate" "main" {
  count   = var.environment == "production" ? 1 : 0
  name    = "vct-platform-cert"
  project = var.project_id

  managed {
    domains = [var.domain, "api.${var.domain}"]
  }
}

# ── Outputs ───────────────────────────────
output "zone_name" {
  value = var.environment == "production" ? google_dns_managed_zone.main[0].name : "n/a"
}
output "name_servers" {
  value = var.environment == "production" ? google_dns_managed_zone.main[0].name_servers : []
}
output "ssl_cert_id" {
  value = var.environment == "production" ? google_compute_managed_ssl_certificate.main[0].id : "n/a"
}
