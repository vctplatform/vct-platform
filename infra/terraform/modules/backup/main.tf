# ════════════════════════════════════════
# Terraform — GCS Backup Bucket + Cross-Region
# ════════════════════════════════════════

variable "project_id"  { type = string }
variable "environment" { type = string }
variable "labels"      { type = map(string) }

locals {
  is_prod = var.environment == "production"
}

# ── Primary Backup Bucket ─────────────────
resource "google_storage_bucket" "backups" {
  name     = "vct-platform-backups-${var.environment}"
  project  = var.project_id
  location = local.is_prod ? "ASIA" : "ASIA-SOUTHEAST1"

  storage_class               = local.is_prod ? "NEARLINE" : "STANDARD"
  uniform_bucket_level_access = true
  force_destroy               = !local.is_prod

  versioning {
    enabled = local.is_prod
  }

  lifecycle_rule {
    condition {
      age = local.is_prod ? 90 : 30
    }
    action {
      type = "Delete"
    }
  }

  lifecycle_rule {
    condition {
      age                = 30
      matches_storage_class = ["NEARLINE"]
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }

  labels = var.labels
}

# ── Cross-Region Replication (Production) ──
resource "google_storage_bucket" "backups_dr" {
  count    = local.is_prod ? 1 : 0
  name     = "vct-platform-backups-dr"
  project  = var.project_id
  location = "US"  # Cross-region DR

  storage_class               = "COLDLINE"
  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 180  # 6 months
    }
    action {
      type = "Delete"
    }
  }

  labels = merge(var.labels, {
    purpose = "disaster-recovery"
  })
}

# ── Transfer job: primary → DR bucket ─────
resource "google_storage_transfer_job" "cross_region" {
  count       = local.is_prod ? 1 : 0
  description = "VCT Platform cross-region backup replication"
  project     = var.project_id

  transfer_spec {
    gcs_data_source {
      bucket_name = google_storage_bucket.backups.name
      path        = "dumps/"
    }
    gcs_data_sink {
      bucket_name = google_storage_bucket.backups_dr[0].name
      path        = "replicated/"
    }
  }

  schedule {
    schedule_start_date {
      year  = 2026
      month = 1
      day   = 1
    }
    start_time_of_day {
      hours   = 4
      minutes = 0
    }
    repeat_interval = "86400s"  # Daily
  }
}

# ── IAM — Backup service account ──────────
resource "google_storage_bucket_iam_member" "backup_writer" {
  bucket = google_storage_bucket.backups.name
  role   = "roles/storage.objectCreator"
  member = "serviceAccount:vct-backup@${var.project_id}.iam.gserviceaccount.com"
}

resource "google_storage_bucket_iam_member" "backup_reader" {
  bucket = google_storage_bucket.backups.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:vct-backup@${var.project_id}.iam.gserviceaccount.com"
}

# ── Outputs ───────────────────────────────
output "backup_bucket"    { value = google_storage_bucket.backups.name }
output "dr_bucket"        { value = local.is_prod ? google_storage_bucket.backups_dr[0].name : "n/a" }
output "backup_bucket_url" { value = google_storage_bucket.backups.url }
