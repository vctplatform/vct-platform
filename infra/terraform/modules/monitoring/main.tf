# ════════════════════════════════════════
# Monitoring Module — GCP Cloud Monitoring
# Uptime checks, alert policies, notification channels
# ════════════════════════════════════════

variable "name_prefix"  { type = string }
variable "project_id"   { type = string }
variable "environment"  { type = string }
variable "domain"       { type = string }
variable "labels"       { type = map(string) }

variable "notification_email" {
  description = "Email for alert notifications"
  type        = string
  default     = "ops@vct-platform.com"
}

variable "slack_webhook_url" {
  description = "Slack webhook for alert notifications (optional)"
  type        = string
  default     = ""
  sensitive   = true
}

locals {
  is_prod = var.environment == "production"
}

# ── Notification Channels ─────────────────

resource "google_monitoring_notification_channel" "email" {
  display_name = "${var.name_prefix}-email"
  project      = var.project_id
  type         = "email"

  labels = {
    email_address = var.notification_email
  }
}

resource "google_monitoring_notification_channel" "slack" {
  count        = var.slack_webhook_url != "" ? 1 : 0
  display_name = "${var.name_prefix}-slack"
  project      = var.project_id
  type         = "slack"

  labels = {
    channel_name = "#vct-alerts"
  }

  sensitive_labels {
    auth_token = var.slack_webhook_url
  }
}

locals {
  notification_channels = concat(
    [google_monitoring_notification_channel.email.name],
    var.slack_webhook_url != "" ? [google_monitoring_notification_channel.slack[0].name] : []
  )
}

# ── Uptime Checks ─────────────────────────

resource "google_monitoring_uptime_check_config" "api_health" {
  display_name = "${var.name_prefix}-api-healthz"
  project      = var.project_id
  timeout      = "10s"
  period       = "60s"

  http_check {
    path         = "/healthz"
    port         = 443
    use_ssl      = true
    validate_ssl = true
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = "api.${var.domain}"
    }
  }

  selected_regions = [
    "ASIA_PACIFIC",
    "USA",
    "EUROPE"
  ]
}

resource "google_monitoring_uptime_check_config" "frontend" {
  display_name = "${var.name_prefix}-frontend"
  project      = var.project_id
  timeout      = "10s"
  period       = "60s"

  http_check {
    path         = "/"
    port         = 443
    use_ssl      = true
    validate_ssl = true
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = var.domain
    }
  }

  selected_regions = ["ASIA_PACIFIC", "USA"]
}

# ── Alert Policies ────────────────────────

# API uptime < 99.9%
resource "google_monitoring_alert_policy" "api_uptime" {
  display_name = "${var.name_prefix} — API Uptime Alert"
  project      = var.project_id
  combiner     = "OR"

  conditions {
    display_name = "API Health Check Failure"
    condition_threshold {
      filter          = "resource.type = \"uptime_url\" AND metric.type = \"monitoring.googleapis.com/uptime_check/check_passed\" AND metric.labels.check_id = \"${google_monitoring_uptime_check_config.api_health.uptime_check_id}\""
      comparison      = "COMPARISON_GT"
      threshold_value = 1
      duration        = "300s"

      aggregations {
        alignment_period     = "300s"
        per_series_aligner   = "ALIGN_NEXT_OLDER"
        cross_series_reducer = "REDUCE_COUNT_FALSE"
        group_by_fields      = ["resource.label.project_id"]
      }

      trigger {
        count = 1
      }
    }
  }

  notification_channels = local.notification_channels
  alert_strategy {
    auto_close = "1800s"
  }

  user_labels = var.labels
}

# Cloud SQL CPU > 80%
resource "google_monitoring_alert_policy" "database_cpu" {
  display_name = "${var.name_prefix} — Database CPU Alert"
  project      = var.project_id
  combiner     = "OR"

  conditions {
    display_name = "Cloud SQL CPU > 80%"
    condition_threshold {
      filter          = "resource.type = \"cloudsql_database\" AND metric.type = \"cloudsql.googleapis.com/database/cpu/utilization\""
      comparison      = "COMPARISON_GT"
      threshold_value = 0.8
      duration        = "300s"

      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = local.notification_channels
  user_labels           = var.labels
}

# Cloud SQL Storage > 85%
resource "google_monitoring_alert_policy" "database_disk" {
  display_name = "${var.name_prefix} — Database Disk Alert"
  project      = var.project_id
  combiner     = "OR"

  conditions {
    display_name = "Cloud SQL Disk > 85%"
    condition_threshold {
      filter          = "resource.type = \"cloudsql_database\" AND metric.type = \"cloudsql.googleapis.com/database/disk/utilization\""
      comparison      = "COMPARISON_GT"
      threshold_value = 0.85
      duration        = "300s"

      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = local.notification_channels
  user_labels           = var.labels
}

# GKE Node CPU > 85%
resource "google_monitoring_alert_policy" "gke_node_cpu" {
  display_name = "${var.name_prefix} — GKE Node CPU Alert"
  project      = var.project_id
  combiner     = "OR"

  conditions {
    display_name = "GKE Node CPU > 85%"
    condition_threshold {
      filter          = "resource.type = \"k8s_node\" AND metric.type = \"kubernetes.io/node/cpu/allocatable_utilization\""
      comparison      = "COMPARISON_GT"
      threshold_value = 0.85
      duration        = "300s"

      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = local.notification_channels
  user_labels           = var.labels
}

# GKE Pod Restart Rate
resource "google_monitoring_alert_policy" "pod_restart" {
  display_name = "${var.name_prefix} — Pod Restart Alert"
  project      = var.project_id
  combiner     = "OR"

  conditions {
    display_name = "Pod restart count > 5 in 30m"
    condition_threshold {
      filter          = "resource.type = \"k8s_container\" AND metric.type = \"kubernetes.io/container/restart_count\""
      comparison      = "COMPARISON_GT"
      threshold_value = 5
      duration        = "0s"

      aggregations {
        alignment_period   = "1800s"
        per_series_aligner = "ALIGN_DELTA"
      }
    }
  }

  notification_channels = local.notification_channels
  user_labels           = var.labels
}

# ── Dashboard ─────────────────────────────

resource "google_monitoring_dashboard" "vct_overview" {
  dashboard_json = jsonencode({
    displayName = "VCT Platform — ${title(var.environment)}"
    gridLayout = {
      columns = 3
      widgets = [
        {
          title = "API Request Rate"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type = \"k8s_container\" AND metric.type = \"prometheus.googleapis.com/http_requests_total/counter\""
                  aggregation = {
                    alignmentPeriod  = "60s"
                    perSeriesAligner = "ALIGN_RATE"
                  }
                }
              }
            }]
          }
        },
        {
          title = "API Latency P99"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type = \"k8s_container\" AND metric.type = \"prometheus.googleapis.com/http_request_duration_seconds/histogram\""
                  aggregation = {
                    alignmentPeriod  = "60s"
                    perSeriesAligner = "ALIGN_PERCENTILE_99"
                  }
                }
              }
            }]
          }
        },
        {
          title = "Database Connections"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type = \"cloudsql_database\" AND metric.type = \"cloudsql.googleapis.com/database/network/connections\""
                  aggregation = {
                    alignmentPeriod  = "60s"
                    perSeriesAligner = "ALIGN_MEAN"
                  }
                }
              }
            }]
          }
        }
      ]
    }
  })
  project = var.project_id
}

# ── Outputs ───────────────────────────────

output "uptime_check_api_id" {
  value = google_monitoring_uptime_check_config.api_health.uptime_check_id
}

output "dashboard_name" {
  value = google_monitoring_dashboard.vct_overview.id
}

output "notification_channel_ids" {
  value = local.notification_channels
}
