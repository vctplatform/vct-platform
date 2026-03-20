# ════════════════════════════════════════
# GKE Module — Kubernetes Cluster
# ════════════════════════════════════════

variable "name_prefix"         { type = string }
variable "region"              { type = string }
variable "project_id"          { type = string }
variable "environment"         { type = string }
variable "vpc_id"              { type = string }
variable "subnet_id"           { type = string }
variable "pods_range_name"     { type = string }
variable "services_range_name" { type = string }
variable "labels"              { type = map(string) }

locals {
  is_prod = var.environment == "production"
}

# ── GKE Cluster ───────────────────────────
resource "google_container_cluster" "primary" {
  name     = "${var.name_prefix}-gke"
  project  = var.project_id
  location = var.region

  # Remove default node pool, use custom
  remove_default_node_pool = true
  initial_node_count       = 1

  network    = var.vpc_id
  subnetwork = var.subnet_id

  ip_allocation_policy {
    cluster_secondary_range_name  = var.pods_range_name
    services_secondary_range_name = var.services_range_name
  }

  # Private cluster
  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }

  # Security
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  release_channel {
    channel = local.is_prod ? "STABLE" : "REGULAR"
  }

  maintenance_policy {
    daily_maintenance_window {
      start_time = "03:00"
    }
  }

  resource_labels = var.labels

  # Logging & monitoring
  logging_config {
    enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS"]
  }
  monitoring_config {
    enable_components = ["SYSTEM_COMPONENTS"]
    managed_prometheus {
      enabled = true
    }
  }
}

# ── Node Pool ─────────────────────────────
resource "google_container_node_pool" "primary" {
  name       = "${var.name_prefix}-pool"
  project    = var.project_id
  location   = var.region
  cluster    = google_container_cluster.primary.name

  initial_node_count = local.is_prod ? 3 : 1

  autoscaling {
    min_node_count = local.is_prod ? 2 : 1
    max_node_count = local.is_prod ? 10 : 3
  }

  node_config {
    machine_type = local.is_prod ? "e2-standard-4" : "e2-medium"
    disk_size_gb = local.is_prod ? 100 : 50
    disk_type    = "pd-ssd"

    preemptible = !local.is_prod

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]

    labels = merge(var.labels, {
      node_pool = "primary"
    })

    tags = ["${var.name_prefix}-gke-node"]

    # Workload Identity
    workload_metadata_config {
      mode = "GKE_METADATA"
    }
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }
}

# ── Outputs ───────────────────────────────
output "cluster_name"     { value = google_container_cluster.primary.name }
output "cluster_endpoint" { value = google_container_cluster.primary.endpoint }
output "cluster_ca_cert"  { value = google_container_cluster.primary.master_auth[0].cluster_ca_certificate }
