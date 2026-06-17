terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  # Bootstrap state is kept in the same bucket under a separate prefix so it
  # is isolated from the rebuildable app-tier state ("staging").
  backend "gcs" {
    bucket = "cti-backend-prod-terraform-state"
    prefix = "bootstrap"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# ---------------------------------------------------------------------------
# BOOTSTRAP TIER (create once, do NOT destroy)
#
# These resources are the foundation the rest of the system depends on:
#   - The GitHub Actions identity that runs Terraform and deploys the app
#   - The project-level IAM roles for that identity
#   - The enabled Google Cloud APIs
#
# Destroying these would break CI/CD (the deploy workflow authenticates as the
# service account below) and would require rotating the GCP_SA_KEY secret.
# The app tier (terraform/staging) can be freely destroyed/rebuilt without
# touching anything here.
# ---------------------------------------------------------------------------

# Required Google Cloud APIs for the whole stack.
# disable_on_destroy = false so destroying this config never turns the APIs off.
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "secretmanager.googleapis.com",
    "artifactregistry.googleapis.com",
    "iam.googleapis.com",
  ])

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

# Service account for GitHub Actions
resource "google_service_account" "github_actions" {
  account_id   = "github-actions-staging"
  display_name = "GitHub Actions Staging Service Account"
  description  = "Service account for GitHub Actions to deploy staging infrastructure"

  lifecycle {
    prevent_destroy = true
  }
}

# NOTE: The service account KEY is intentionally NOT managed by Terraform.
# It was created out-of-band and stored in the GitHub secret GCP_SA_KEY.
# Importing a key into Terraform cannot recover its private material, and a
# Terraform-driven recreate would silently rotate it and break CI auth.
# Rotate manually with:
#   gcloud iam service-accounts keys create key.json \
#     --iam-account=github-actions-staging@cti-backend-prod.iam.gserviceaccount.com
# then update the GCP_SA_KEY GitHub secret.

# Project IAM roles granted to the GitHub Actions service account
resource "google_project_iam_member" "github_actions_roles" {
  for_each = toset([
    "roles/artifactregistry.writer",
    "roles/run.developer",
    "roles/run.admin",
    "roles/cloudsql.admin",
    "roles/cloudsql.instanceUser",
    "roles/iam.serviceAccountAdmin",
    "roles/resourcemanager.projectIamAdmin",
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

# Allow the GitHub Actions SA to act as the compute runtime service account
# (required for Cloud Run deploys: iam.serviceaccounts.actAs).
resource "google_service_account_iam_member" "compute_service_account_user" {
  service_account_id = "projects/${var.project_id}/serviceAccounts/${var.compute_service_account}"
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.github_actions.email}"
}

# Allow the GitHub Actions SA to read/write the Terraform remote state in GCS.
# Without this, CI `terraform init` fails with a 403 listing the state bucket.
# Scoped to the state bucket only (not project-wide storage access).
resource "google_storage_bucket_iam_member" "terraform_state" {
  bucket = var.state_bucket
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.github_actions.email}"
}
