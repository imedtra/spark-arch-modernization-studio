#!/usr/bin/env bash
set -e

export PATH="/tmp/bin:$PATH"
export CLOUDSDK_METRICS_ENVIRONMENT="${CLOUDSDK_METRICS_ENVIRONMENT:+$CLOUDSDK_METRICS_ENVIRONMENT }datacloud.jetski"

# Support running via blaze run or direct invocation
if [[ -n "${BUILD_WORKSPACE_DIRECTORY}" ]]; then
  cd "${BUILD_WORKSPACE_DIRECTORY}/experimental/emea-oce-tooling/arch-modernization-studio"
else
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  cd "$SCRIPT_DIR"
fi

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <config_directory>"
    echo "Error: Config directory argument is mandatory (must contain terraform.tfvars)."
    exit 1
fi

CONFIG_DIR="$1"
# Ensure absolute path
[[ "$CONFIG_DIR" = /* ]] || CONFIG_DIR="$PWD/$CONFIG_DIR"

TFVARS_FILE="$CONFIG_DIR/terraform.tfvars"

if [ ! -f "$TFVARS_FILE" ]; then
    echo "Error: $TFVARS_FILE not found!"
    echo "Please ensure the config directory contains a terraform.tfvars file."
    exit 1
fi

PROJECT_ID=$(grep -E '^\s*project_id\s*=' "$TFVARS_FILE" | cut -d'=' -f2 | tr -d ' "' | tr -d "'")
REGION=$(grep -E '^\s*region\s*=' "$TFVARS_FILE" | cut -d'=' -f2 | tr -d ' "' | tr -d "'" || echo "europe-west1")
APP_NAME=$(grep -E '^\s*app_name\s*=' "$TFVARS_FILE" | cut -d'=' -f2 | tr -d ' "' | tr -d "'" || echo "spark-arch-studio")

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" == "my-gcp-project-id" ]; then
    echo "Error: Please set a valid project_id in $TFVARS_FILE."
    exit 1
fi

# Verify active gcloud account is an Argolis Dasher account (*.altostrat.com)
ACTIVE_ACCOUNT=$(gcloud config get-value account 2>/dev/null || echo "")
echo "============================================================"
echo " SPARK Architecture Modernization Studio — Argolis Deployment"
echo " Active gcloud Account : $ACTIVE_ACCOUNT"
echo " Target GCP Project    : $PROJECT_ID"
echo " Region                : $REGION"
echo " App Name              : $APP_NAME"
echo " Config Dir            : $CONFIG_DIR"
echo "============================================================"

if [[ "$ACTIVE_ACCOUNT" == *"@google.com" ]]; then
    echo ""
    echo "⚠️  WARNING: Your gcloud CLI is currently authenticated as '$ACTIVE_ACCOUNT' (corporate account)."
    echo "   Per go/argolis & go/argolis-dns, Argolis environments require your Dasher account:"
    echo "     admin@imedtra.altostrat.com  (or imedtra@imedtra.altostrat.com)"
    echo ""
    echo "   Please authenticate your Argolis account in your terminal first:"
    echo "     gcloud auth login admin@imedtra.altostrat.com"
    echo "     gcloud auth application-default login"
    echo ""
    exit 1
fi

IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${APP_NAME}-repo/${APP_NAME}:latest"

# 0. Check if GCP Project exists; if not, create it and link an open Argolis billing account
if ! gcloud projects describe "$PROJECT_ID" &>/dev/null; then
    echo "--> GCP Project '$PROJECT_ID' does not exist in Argolis org. Creating new project..."
    gcloud projects create "$PROJECT_ID" --name="$APP_NAME"

    BILLING_ACCOUNT=$(gcloud billing accounts list --filter="open=true" --format="value(ACCOUNT_ID)" | head -n 1)
    if [ -n "$BILLING_ACCOUNT" ]; then
        echo "--> Linking active Argolis billing account '$BILLING_ACCOUNT' to project '$PROJECT_ID'..."
        gcloud billing projects link "$PROJECT_ID" --billing-account="$BILLING_ACCOUNT"
    else
        echo "Notice: No open billing account automatically found. Please ensure billing is enabled at go/argolis."
    fi
fi

# Set active project context
gcloud config set project "$PROJECT_ID"

# 1. Enable required GCP APIs (including Cloud Build & Cloud DNS per go/argolis-dns)
echo "--> Enabling Artifact Registry, Cloud Build, Cloud Run, Compute, IAP, and Cloud DNS APIs..."
gcloud services enable \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    compute.googleapis.com \
    iap.googleapis.com \
    dns.googleapis.com \
    --project="$PROJECT_ID"

# 2. Ensure Artifact Registry repository exists before building container
echo "--> Ensuring Artifact Registry repository '${APP_NAME}-repo' exists in ${REGION}..."
if ! gcloud artifacts repositories describe "${APP_NAME}-repo" --location="$REGION" --project="$PROJECT_ID" &>/dev/null; then
    gcloud artifacts repositories create "${APP_NAME}-repo" \
        --repository-format=docker \
        --location="$REGION" \
        --description="Docker repository for ${APP_NAME}" \
        --project="$PROJECT_ID"
fi

# 2.5 Grant Cloud Build & Compute Service Accounts required IAM permissions on brand-new Argolis projects
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
echo "--> Granting Storage, Artifact Registry, and Logging IAM roles to Cloud Build Service Accounts ($PROJECT_NUMBER)..."
for SA in "${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" "${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"; do
    for ROLE in "roles/storage.admin" "roles/artifactregistry.writer" "roles/logging.logWriter" "roles/cloudbuild.builds.builder"; do
        gcloud projects add-iam-policy-binding "$PROJECT_ID" \
            --member="serviceAccount:${SA}" \
            --role="${ROLE}" \
            --condition=None &>/dev/null || true
    done
done
sleep 5

# 3. Build & Push the SPARK Architecture Modernization Studio Docker Image via Cloud Build
if [[ "${FORCE_REBUILD:-0}" == "1" ]] || ! gcloud artifacts docker images describe "$IMAGE_URI" --project="$PROJECT_ID" &>/dev/null; then
    echo "--> Building and pushing Docker image ($IMAGE_URI) via Cloud Build..."
    gcloud builds submit ./app \
        --tag "$IMAGE_URI" \
        --project="$PROJECT_ID"
else
    echo "--> Docker image ($IMAGE_URI) already exists in Artifact Registry. Skipping Cloud Build."
fi

# 4. Deploy Cloud Run + IAP Global Load Balancer via Terraform
echo "--> Deploying Cloud Run & Identity-Aware Proxy (IAP) infrastructure via Terraform..."
cd terraform
terraform init
terraform apply -auto-approve \
    -var-file="$TFVARS_FILE" \
    -var="container_image=$IMAGE_URI" \
    -state="$CONFIG_DIR/terraform.tfstate"

# Extract outputs
LB_IP=$(terraform output -state="$CONFIG_DIR/terraform.tfstate" -raw load_balancer_ip 2>/dev/null || echo "")
APP_URL=$(terraform output -state="$CONFIG_DIR/terraform.tfstate" -raw app_url 2>/dev/null || echo "")
CLOUD_RUN_URL=$(terraform output -state="$CONFIG_DIR/terraform.tfstate" -raw cloud_run_service_url 2>/dev/null || echo "")
DOMAIN=$(echo "$APP_URL" | sed 's|https://||' | sed 's|http://||')

# 5. Automated Cloud DNS A-Record Creation (per go/argolis-dns)
DNS_ZONE_NAME="imedtra-demo"
DNS_SUFFIX="imedtra.demo.altostrat.com."
echo "--> Configuring Cloud DNS Managed Zone ($DNS_ZONE_NAME) for $DOMAIN -> $LB_IP (per go/argolis-dns)..."
if ! gcloud dns managed-zones describe "$DNS_ZONE_NAME" --project="$PROJECT_ID" &>/dev/null; then
    echo "--> Creating Cloud DNS Managed Zone '$DNS_ZONE_NAME' ($DNS_SUFFIX) with DNSSEC=off..."
    gcloud dns managed-zones create "$DNS_ZONE_NAME" \
        --dns-name="$DNS_SUFFIX" \
        --description="Argolis Demo Managed Zone per go/argolis-dns" \
        --dnssec-state=off \
        --project="$PROJECT_ID" || true
fi

if [ -n "$LB_IP" ] && [ -n "$DOMAIN" ]; then
    echo "--> Registering DNS A record: ${DOMAIN}. -> ${LB_IP}"
    gcloud dns record-sets transaction start --zone="$DNS_ZONE_NAME" --project="$PROJECT_ID" 2>/dev/null || true
    gcloud dns record-sets transaction remove --name="${DOMAIN}." --type=A --zone="$DNS_ZONE_NAME" --project="$PROJECT_ID" 2>/dev/null || true
    gcloud dns record-sets transaction add "$LB_IP" --name="${DOMAIN}." --ttl=300 --type=A --zone="$DNS_ZONE_NAME" --project="$PROJECT_ID" 2>/dev/null || true
    gcloud dns record-sets transaction execute --zone="$DNS_ZONE_NAME" --project="$PROJECT_ID" 2>/dev/null || true
fi

echo "============================================================"
echo " Deployment Complete!"
echo " Direct Cloud Run URL    : $CLOUD_RUN_URL"
echo " App URL (Load Balancer) : $APP_URL"
echo " Load Balancer IP        : $LB_IP"
echo " Domain Name             : $DOMAIN"
echo "============================================================"
