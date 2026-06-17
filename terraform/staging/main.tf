terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  backend "gcs" {
    bucket = "cti-backend-prod-terraform-state"
    prefix = "staging"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Cloud SQL instance
resource "google_sql_database_instance" "staging" {
  name             = "dojo-db-staging"
  database_version = "POSTGRES_15"
  region           = var.region
  
  settings {
    tier              = "db-f1-micro"
    disk_autoresize   = true
    disk_size         = 10
    disk_type         = "PD_SSD"
    availability_type = "REGIONAL"
    
    backup_configuration {
      enabled = true
    }
    
    ip_configuration {
      ipv4_enabled = true
      ssl_mode     = "ALLOW_UNENCRYPTED_AND_ENCRYPTED"
    }
  }
  
  deletion_protection = false
}

# Database
resource "google_sql_database" "staging" {
  name     = "dojo"
  instance = google_sql_database_instance.staging.name
}

# Database user
resource "google_sql_user" "postgres" {
  name     = "postgres"
  instance = google_sql_database_instance.staging.name
  password = var.db_password
}

# Service account for GitHub Actions
resource "google_service_account" "github_actions" {
  account_id   = "github-actions-staging"
  display_name = "GitHub Actions Staging Service Account"
  description  = "Service account for GitHub Actions to deploy staging infrastructure"
}

# Service account key for GitHub Actions authentication
resource "google_service_account_key" "github_actions" {
  service_account_id = google_service_account.github_actions.name
}

# Grant service account permission to push to GCR/Artifact Registry
resource "google_project_iam_member" "gcr_push" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

# Grant service account permission to deploy to Cloud Run
resource "google_project_iam_member" "cloudrun_deployer" {
  project = var.project_id
  role    = "roles/run.developer"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

# Grant service account permission to access Cloud SQL
resource "google_project_iam_member" "cloudsql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

# Grant service account permission to create Cloud SQL instances
resource "google_project_iam_member" "cloudsql_admin" {
  project = var.project_id
  role    = "roles/cloudsql.admin"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

# Grant service account permission to execute SQL on Cloud SQL instances
resource "google_project_iam_member" "cloudsql_instance_user" {
  project = var.project_id
  role    = "roles/cloudsql.instanceUser"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

# Grant service account permission to create service accounts
resource "google_project_iam_member" "service_account_admin" {
  project = var.project_id
  role    = "roles/iam.serviceAccountAdmin"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

# Grant service account permission to manage IAM bindings
resource "google_project_iam_member" "iam_admin" {
  project = var.project_id
  role    = "roles/resourcemanager.projectIamAdmin"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

# Grant service account permission to act as compute service account
resource "google_service_account_iam_member" "compute_service_account_user" {
  service_account_id = "projects/cti-backend-prod/serviceAccounts/561867108932-compute@developer.gserviceaccount.com"
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.github_actions.email}"
}
