# ════════════════════════════════════════
# Networking Module — VPC, Subnets, Firewall
# ════════════════════════════════════════

variable "name_prefix" { type = string }
variable "region"      { type = string }
variable "project_id"  { type = string }
variable "labels"      { type = map(string) }

# ── VPC ───────────────────────────────────
resource "google_compute_network" "vpc" {
  name                    = "${var.name_prefix}-vpc"
  project                 = var.project_id
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
}

# ── Subnet ────────────────────────────────
resource "google_compute_subnetwork" "main" {
  name          = "${var.name_prefix}-subnet"
  project       = var.project_id
  region        = var.region
  network       = google_compute_network.vpc.id
  ip_cidr_range = "10.0.0.0/20"

  secondary_ip_range {
    range_name    = "${var.name_prefix}-pods"
    ip_cidr_range = "10.4.0.0/14"
  }

  secondary_ip_range {
    range_name    = "${var.name_prefix}-services"
    ip_cidr_range = "10.8.0.0/20"
  }

  private_ip_google_access = true
}

# ── Cloud NAT ─────────────────────────────
resource "google_compute_router" "router" {
  name    = "${var.name_prefix}-router"
  project = var.project_id
  region  = var.region
  network = google_compute_network.vpc.id
}

resource "google_compute_router_nat" "nat" {
  name                               = "${var.name_prefix}-nat"
  project                            = var.project_id
  router                             = google_compute_router.router.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}

# ── Firewall ──────────────────────────────
resource "google_compute_firewall" "allow_internal" {
  name    = "${var.name_prefix}-allow-internal"
  project = var.project_id
  network = google_compute_network.vpc.id

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }
  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }
  allow {
    protocol = "icmp"
  }

  source_ranges = ["10.0.0.0/8"]
}

resource "google_compute_firewall" "allow_health_checks" {
  name    = "${var.name_prefix}-allow-health"
  project = var.project_id
  network = google_compute_network.vpc.id

  allow {
    protocol = "tcp"
    ports    = ["80", "443", "18080"]
  }

  # GCP health check ranges
  source_ranges = ["130.211.0.0/22", "35.191.0.0/16"]
}

# ── Private Service Access (for Cloud SQL) ──
resource "google_compute_global_address" "private_ip" {
  name          = "${var.name_prefix}-private-ip"
  project       = var.project_id
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
}

resource "google_service_networking_connection" "private" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip.name]
}

# ── Outputs ───────────────────────────────
output "vpc_id"              { value = google_compute_network.vpc.id }
output "subnet_id"           { value = google_compute_subnetwork.main.id }
output "pods_range_name"     { value = google_compute_subnetwork.main.secondary_ip_range[0].range_name }
output "services_range_name" { value = google_compute_subnetwork.main.secondary_ip_range[1].range_name }
output "private_network_id"  { value = google_compute_network.vpc.id }
