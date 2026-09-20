output "load_balancer_ip" {
  description = "The external static IP address assigned to the global HTTPS load balancer. Point your DNS A record to this IP."
  value       = google_compute_global_address.default.address
}

output "cloud_run_service_url" {
  description = "The direct URL of the Cloud Run service (access restricted by ingress settings)."
  value       = google_cloud_run_v2_service.default.uri
}

output "app_url" {
  description = "The HTTPS URL of the application protected by IAP."
  value       = "https://${var.domain_name}"
}

output "iap_oauth_redirect_uri" {
  description = "The authorized redirect URI configured for IAP OAuth 2.0."
  value       = "https://iap.googleapis.com/v1/oauth/clientIds/${local.oauth_client_id}:handleRedirect"
  sensitive   = true
}

output "artifact_registry_repository" {
  description = "The Artifact Registry repository created for building and storing custom container images."
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.app_repo.name}"
}
