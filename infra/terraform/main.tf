# ════════════════════════════════════════
# VCT Platform — Main Orchestration
# ════════════════════════════════════════

locals {
  name_prefix = "vct-${var.environment}"
  common_labels = {
    project     = "vct-platform"
    environment = var.environment
    managed_by  = "terraform"
  }
}

# ── Enable Required APIs ──────────────────
resource "google_project_service" "apis" {
  for_each = toset([
    "compute.googleapis.com",
    "container.googleapis.com",
    "sqladmin.googleapis.com",
    "servicenetworking.googleapis.com",
    "dns.googleapis.com",
    "cloudresourcemanager.googleapis.com",
  ])
  service            = each.key
  disable_on_destroy = false
}

# ── Networking ────────────────────────────
module "networking" {
  source      = "./modules/networking"
  name_prefix = local.name_prefix
  region      = var.region
  project_id  = var.project_id
  labels      = local.common_labels
  depends_on  = [google_project_service.apis]
}

# ── GKE Cluster ───────────────────────────
module "gke" {
  source             = "./modules/gke"
  name_prefix        = local.name_prefix
  region             = var.region
  project_id         = var.project_id
  environment        = var.environment
  vpc_id             = module.networking.vpc_id
  subnet_id          = module.networking.subnet_id
  pods_range_name    = module.networking.pods_range_name
  services_range_name = module.networking.services_range_name
  labels             = local.common_labels
  depends_on         = [module.networking]
}

# ── Cloud SQL Database ────────────────────
module "database" {
  source              = "./modules/database"
  name_prefix         = local.name_prefix
  region              = var.region
  project_id          = var.project_id
  environment         = var.environment
  vpc_id              = module.networking.vpc_id
  private_network_id  = module.networking.private_network_id
  labels              = local.common_labels
  depends_on          = [module.networking]
}

# ── DNS ───────────────────────────────────
module "dns" {
  source      = "./modules/dns"
  domain      = var.domain
  project_id  = var.project_id
  environment = var.environment
  labels      = local.common_labels
}

# ── Secret Manager ────────────────────────
module "secrets" {
  source      = "./modules/secrets"
  project_id  = var.project_id
  environment = var.environment
  labels      = local.common_labels
  depends_on  = [module.gke]
}

# ── Monitoring & Alerting ─────────────────
module "monitoring" {
  source      = "./modules/monitoring"
  name_prefix = local.name_prefix
  project_id  = var.project_id
  environment = var.environment
  domain      = var.domain
  labels      = local.common_labels
  depends_on  = [module.gke, module.database]
}

# ── Backup & DR ───────────────────────────
module "backup" {
  source      = "./modules/backup"
  project_id  = var.project_id
  environment = var.environment
  labels      = local.common_labels
}
