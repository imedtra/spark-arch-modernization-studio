variable "project_id" {
  type        = string
  description = "The GCP Project ID where resources will be created."
}

variable "region" {
  type        = string
  description = "The GCP region for the Cloud Run service and Serverless NEG."
  default     = "us-central1"
}

variable "app_name" {
  type        = string
  description = "The name of the Cloud Run application and prefix for load balancer resources."
  default     = "hello-cloud-run"
}

variable "container_image" {
  type        = string
  description = "The container image to deploy on Cloud Run."
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "allowed_domain" {
  type        = string
  description = "The domain whose users are granted access via IAP."
  default     = "google.com"
}

variable "support_email" {
  type        = string
  description = "Support email for automatic IAP OAuth Consent Screen creation (e.g. user@domain.com)."
  default     = ""
}

variable "iap_oauth_client_id" {
  type        = string
  description = "OAuth 2.0 Client ID for IAP. If left blank, Terraform will attempt to create it automatically using google_iap_client."
  default     = ""
}

variable "iap_oauth_client_secret" {
  type        = string
  description = "OAuth 2.0 Client Secret for IAP. If left blank, Terraform will attempt to create it automatically using google_iap_client."
  default     = ""
  sensitive   = true
}

variable "domain_name" {
  type        = string
  description = "The custom domain name pointing to the load balancer (used for Managed SSL Certificate)."
}

variable "enable_http_redirect" {
  type        = bool
  description = "Whether to enable HTTP to HTTPS redirect on the external load balancer."
  default     = true
}
