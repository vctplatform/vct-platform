# ════════════════════════════════════════
# VCT Platform — Root Outputs
# ════════════════════════════════════════

output "gke_cluster_name" {
  description = "GKE cluster name"
  value       = module.gke.cluster_name
}

output "gke_cluster_endpoint" {
  description = "GKE cluster endpoint"
  value       = module.gke.cluster_endpoint
  sensitive   = true
}

output "database_connection_name" {
  description = "Cloud SQL connection name"
  value       = module.database.connection_name
}

output "database_private_ip" {
  description = "Cloud SQL private IP"
  value       = module.database.private_ip
  sensitive   = true
}

output "vpc_id" {
  description = "VPC network ID"
  value       = module.networking.vpc_id
}

output "kubeconfig_command" {
  description = "Command to configure kubectl"
  value       = "gcloud container clusters get-credentials ${module.gke.cluster_name} --region ${var.region} --project ${var.project_id}"
}

output "monitoring_dashboard" {
  description = "Cloud Monitoring dashboard ID"
  value       = module.monitoring.dashboard_name
}

output "uptime_check_api_id" {
  description = "API uptime check ID"
  value       = module.monitoring.uptime_check_api_id
}
