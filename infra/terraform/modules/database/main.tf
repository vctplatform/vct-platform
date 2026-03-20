# ════════════════════════════════════════
# Database Module — Cloud SQL PostgreSQL
# ════════════════════════════════════════

variable "name_prefix"        { type = string }
variable "region"             { type = string }
variable "project_id"         { type = string }
variable "environment"        { type = string }
variable "vpc_id"             { type = string }
variable "private_network_id" { type = string }
variable "labels"             { type = map(string) }

locals {
  is_prod = var.environment == "production"
}

# ── Cloud SQL Instance ────────────────────
resource "google_sql_database_instance" "postgres" {
  name                = "${var.name_prefix}-pg"
  project             = var.project_id
  region              = var.region
  database_version    = "POSTGRES_17"
  deletion_protection = local.is_prod

  settings {
    tier              = local.is_prod ? "db-custom-4-16384" : "db-f1-micro"
    availability_type = local.is_prod ? "REGIONAL" : "ZONAL"
    disk_size         = local.is_prod ? 50 : 10
    disk_type         = "PD_SSD"
    disk_autoresize   = true

    ip_configuration {
      ipv4_enabled    = false
      private_network = var.private_network_id
    }

    backup_configuration {
      enabled                        = true
      start_time                     = "02:00"
      point_in_time_recovery_enabled = local.is_prod
      transaction_log_retention_days = local.is_prod ? 7 : 1
      backup_retention_settings {
        retained_backups = local.is_prod ? 30 : 7
      }
    }

    maintenance_window {
      day          = 7  # Sunday
      hour         = 3
      update_track = local.is_prod ? "stable" : "canary"
    }

    insights_config {
      query_insights_enabled  = true
      query_plans_per_minute  = 5
      query_string_length     = 4096
      record_application_tags = true
      record_client_address   = true
    }

    database_flags {
      name  = "log_checkpoints"
      value = "on"
    }
    database_flags {
      name  = "log_connections"
      value = "on"
    }
    database_flags {
      name  = "log_disconnections"
      value = "on"
    }
    database_flags {
      name  = "log_min_duration_statement"
      value = local.is_prod ? "1000" : "500"
    }

    user_labels = var.labels
  }
}

# ── Database ──────────────────────────────
resource "google_sql_database" "vct" {
  name     = "vct_platform"
  project  = var.project_id
  instance = google_sql_database_instance.postgres.name
}

# ── User ──────────────────────────────────
resource "random_password" "db_password" {
  length  = 32
  special = false
}

resource "google_sql_user" "vct" {
  name     = "vct_user"
  project  = var.project_id
  instance = google_sql_database_instance.postgres.name
  password = random_password.db_password.result
}

# ── Outputs ───────────────────────────────
output "connection_name" { value = google_sql_database_instance.postgres.connection_name }
output "private_ip"      { value = google_sql_database_instance.postgres.private_ip_address }
output "database_name"   { value = google_sql_database.vct.name }
output "user_name"       { value = google_sql_user.vct.name }
output "user_password"   { value = random_password.db_password.result; sensitive = true }
