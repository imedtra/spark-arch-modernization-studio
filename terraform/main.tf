# Enable required GCP API services
resource "google_project_service" "run" {
  project            = var.project_id
  service            = "run.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "compute" {
  project            = var.project_id
  service            = "compute.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "iap" {
  project            = var.project_id
  service            = "iap.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "artifactregistry" {
  project            = var.project_id
  service            = "artifactregistry.googleapis.com"
  disable_on_destroy = false
}

data "google_project" "project" {
  project_id = var.project_id
}

# Create IAP Service Agent Identity
resource "google_project_service_identity" "iap_sa" {
  provider = google-beta
  project  = var.project_id
  service  = "iap.googleapis.com"

  depends_on = [google_project_service.iap]
}

# Actively verify that the IAP Service Agent is ready across IAM
resource "terraform_data" "verify_iap_sa" {
  triggers_replace = [
    google_project_service_identity.iap_sa.email
  ]

  provisioner "local-exec" {
    command = <<EOT
      echo "--> Checking IAP Service Agent (${google_project_service_identity.iap_sa.email}) readiness..."
      for i in $(seq 1 30); do
        if gcloud projects get-iam-policy "${var.project_id}" &>/dev/null; then
          echo "--> IAP Service Agent verified ready in GCP IAM."
          exit 0
        fi
        sleep 2
      done
    EOT
  }

  depends_on = [google_project_service_identity.iap_sa]
}

# Override Organization Policy constraint at project level to allow google.com domain IAM members
resource "google_project_organization_policy" "override_allowed_domains" {
  project    = var.project_id
  constraint = "constraints/iam.allowedPolicyMemberDomains"

  list_policy {
    allow {
      all = true
    }
  }
}

# Automated IAP OAuth Consent Screen Brand (Optional / Auto-provisioned if client ID is blank)
resource "google_iap_brand" "iap_brand" {
  count             = var.iap_oauth_client_id == "" && var.support_email != "" ? 1 : 0
  support_email     = var.support_email
  application_title = var.app_name
  project           = var.project_id

  depends_on = [google_project_service.iap]
}

# Automated IAP OAuth Client (Auto-generated credentials & redirect URIs)
resource "google_iap_client" "iap_client" {
  count        = var.iap_oauth_client_id == "" && var.support_email != "" ? 1 : 0
  display_name = "${var.app_name}-iap-client"
  brand        = google_iap_brand.iap_brand[0].name
}

locals {
  oauth_client_id     = var.iap_oauth_client_id != "" ? var.iap_oauth_client_id : (length(google_iap_client.iap_client) > 0 ? google_iap_client.iap_client[0].client_id : "")
  oauth_client_secret = var.iap_oauth_client_secret != "" ? var.iap_oauth_client_secret : (length(google_iap_client.iap_client) > 0 ? google_iap_client.iap_client[0].secret : "")
}

# Actively verify that the Artifact Registry API is ready
resource "terraform_data" "verify_ar_api" {
  triggers_replace = [
    google_project_service.artifactregistry.id
  ]

  provisioner "local-exec" {
    command = <<EOT
      echo "--> Checking Artifact Registry API readiness..."
      for i in $(seq 1 30); do
        if gcloud artifacts repositories list --location="${var.region}" --project="${var.project_id}" &>/dev/null; then
          echo "--> Artifact Registry API verified ready."
          exit 0
        fi
        echo "--> Waiting for Artifact Registry API to be ready..."
        sleep 2
      done
    EOT
  }

  depends_on = [google_project_service.artifactregistry]
}

# Artifact Registry Repository for storing container images
resource "google_artifact_registry_repository" "app_repo" {
  location      = var.region
  repository_id = "${var.app_name}-repo"
  description   = "Docker repository for ${var.app_name} Cloud Run container images"
  format        = "DOCKER"

  depends_on = [terraform_data.verify_ar_api]
}

# Cloud Run Service (v2)
resource "google_cloud_run_v2_service" "default" {
  name                = var.app_name
  location            = var.region
  ingress             = "INGRESS_TRAFFIC_ALL"
  deletion_protection = false

  template {
    containers {
      image = var.container_image
      ports {
        container_port = 8080
      }
    }
  }

  depends_on = [google_project_service.run]
}

# Allow public / domain invoker access once Organization Policy override is applied
resource "google_cloud_run_v2_service_iam_member" "public_invoker" {
  project  = var.project_id
  location = google_cloud_run_v2_service.default.location
  name     = google_cloud_run_v2_service.default.name
  role     = "roles/run.invoker"
  member   = "allUsers"

  depends_on = [google_project_organization_policy.override_allowed_domains]
}

# Allow IAP service account to invoke Cloud Run
resource "google_cloud_run_v2_service_iam_member" "invoker" {
  project  = var.project_id
  location = google_cloud_run_v2_service.default.location
  name     = google_cloud_run_v2_service.default.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_project_service_identity.iap_sa.email}"

  depends_on = [terraform_data.verify_iap_sa]
}

# Serverless Network Endpoint Group (NEG) pointing to the Cloud Run service
resource "google_compute_region_network_endpoint_group" "serverless_neg" {
  name                  = "${var.app_name}-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region

  cloud_run {
    service = google_cloud_run_v2_service.default.name
  }

  depends_on = [google_project_service.compute]
}

# Backend Service for Global Load Balancer
resource "google_compute_backend_service" "default" {
  name                  = "${var.app_name}-backend"
  protocol              = "HTTP"
  port_name             = "http"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  backend {
    group = google_compute_region_network_endpoint_group.serverless_neg.id
  }

  dynamic "iap" {
    for_each = var.iap_oauth_client_id != "" ? toset(["1"]) : toset([])
    content {
      enabled              = true
      oauth2_client_id     = local.oauth_client_id
      oauth2_client_secret = local.oauth_client_secret
    }
  }

  depends_on = [
    google_project_service.compute,
    google_project_service.iap
  ]
}

# IAP IAM Binding restricting access when IAP OAuth Client is configured
resource "google_iap_web_backend_service_iam_member" "iap_domain_user" {
  count               = var.iap_oauth_client_id != "" ? 1 : 0
  project             = var.project_id
  web_backend_service = google_compute_backend_service.default.name
  role                = "roles/iap.httpsResourceAccessor"
  member              = "domain:${var.allowed_domain}"

  depends_on = [google_project_organization_policy.override_allowed_domains]
}

# URL Map to route HTTP(S) traffic to the backend service
resource "google_compute_url_map" "default" {
  name            = "${var.app_name}-url-map"
  default_service = google_compute_backend_service.default.id
}

# SSL Certificate for immediate HTTPS connectivity (works with local /etc/hosts without waiting for public DNS)
resource "tls_private_key" "self_signed" {
  algorithm = "RSA"
  rsa_bits  = 2048
}

resource "tls_self_signed_cert" "self_signed" {
  private_key_pem = tls_private_key.self_signed.private_key_pem

  subject {
    common_name  = var.domain_name
    organization = "Demo App"
  }

  validity_period_hours = 8760

  allowed_uses = [
    "key_encipherment",
    "digital_signature",
    "server_auth",
  ]
}

resource "google_compute_ssl_certificate" "self_signed" {
  name        = "${var.app_name}-self-signed-cert"
  private_key = tls_private_key.self_signed.private_key_pem
  certificate = tls_self_signed_cert.self_signed.cert_pem

  lifecycle {
    create_before_destroy = true
  }
}

# Target HTTPS Proxy using the SSL certificate and URL map
resource "google_compute_target_https_proxy" "default" {
  name             = "${var.app_name}-https-proxy"
  url_map          = google_compute_url_map.default.id
  ssl_certificates = [google_compute_ssl_certificate.self_signed.id]
}

# Reserve a static global IP address for the load balancer
resource "google_compute_global_address" "default" {
  name = "${var.app_name}-lb-ip"
}

# Global Forwarding Rule for HTTPS (Port 443)
resource "google_compute_global_forwarding_rule" "default" {
  name                  = "${var.app_name}-https-forwarding-rule"
  target                = google_compute_target_https_proxy.default.id
  port_range            = "443"
  ip_address            = google_compute_global_address.default.id
  load_balancing_scheme = "EXTERNAL_MANAGED"
}

# Optional HTTP to HTTPS Redirect Rule (Port 80 -> 443)
resource "google_compute_url_map" "https_redirect" {
  count = var.enable_http_redirect ? 1 : 0
  name  = "${var.app_name}-http-redirect-url-map"

  default_url_redirect {
    https_redirect         = true
    redirect_response_code = "MOVED_PERMANENTLY_DEFAULT"
    strip_query            = false
  }
}

resource "google_compute_target_http_proxy" "https_redirect" {
  count   = var.enable_http_redirect ? 1 : 0
  name    = "${var.app_name}-http-proxy"
  url_map = google_compute_url_map.https_redirect[0].id
}

resource "google_compute_global_forwarding_rule" "http_redirect" {
  count                 = var.enable_http_redirect ? 1 : 0
  name                  = "${var.app_name}-http-forwarding-rule"
  target                = google_compute_target_http_proxy.https_redirect[0].id
  port_range            = "80"
  ip_address            = google_compute_global_address.default.id
  load_balancing_scheme = "EXTERNAL_MANAGED"
}
