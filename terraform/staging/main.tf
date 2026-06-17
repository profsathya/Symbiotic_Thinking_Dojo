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

# ---------------------------------------------------------------------------
# APP TIER (rebuildable — safe to `terraform destroy` and re-apply)
#
# Contains the stateful/app resources for the staging environment:
#   - Cloud SQL instance, database, user
#   - Anthropic API key secret
#   - Cloud Run service (shell: env/secrets/scaling/public access)
#
# The CI/CD bootstrap identity, IAM roles, and API enablement live in
# terraform/bootstrap and are NOT affected by destroying this config.
#
# Image management: the container image is owned by the deploy workflow
# (gcloud run deploy). Terraform ignores image changes (see lifecycle below).
# ---------------------------------------------------------------------------

# Cloud SQL instance
resource "google_sql_database_instance" "staging" {
  name             = "dojo-db-staging"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier            = "db-f1-micro"
    disk_autoresize = true
    disk_size       = 10
    disk_type       = "PD_SSD"
    # db-f1-micro is shared-core and only supports ZONAL availability.
    # (REGIONAL/HA requires a dedicated-core tier and was why creation failed.)
    availability_type = "ZONAL"

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

# Anthropic API key secret (consumed by the Cloud Run service)
resource "google_secret_manager_secret" "anthropic_api_key" {
  secret_id = "anthropic-api-key-staging"
  project   = var.project_id

  replication {
    auto {}
  }
}

# Secret value (supplied via the sensitive anthropic_api_key variable)
resource "google_secret_manager_secret_version" "anthropic_api_key" {
  secret      = google_secret_manager_secret.anthropic_api_key.id
  secret_data = var.anthropic_api_key
}

# Allow the runtime (compute) service account to read the Anthropic secret
resource "google_secret_manager_secret_iam_member" "anthropic_api_key_accessor" {
  secret_id = google_secret_manager_secret.anthropic_api_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${var.compute_service_account}"
}

# Cloud Run service (shell). The deploy workflow updates the image; Terraform
# owns env vars, secrets, Cloud SQL link, scaling, and public access.
resource "google_cloud_run_v2_service" "backend" {
  name     = "dojo-backend-staging"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account                  = var.compute_service_account
    timeout                          = "300s"
    max_instance_request_concurrency = 80
    execution_environment            = "EXECUTION_ENVIRONMENT_GEN2"

    scaling {
      min_instance_count = 0
      max_instance_count = 2
    }

    containers {
      image = var.image

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "1000m"
          memory = "512Mi"
        }
        cpu_idle          = true
        startup_cpu_boost = true
      }

      env {
        name  = "CORS_ORIGINS"
        value = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001"
      }

      env {
        name  = "DATABASE_TYPE"
        value = "postgres"
      }

      env {
        name  = "DATABASE_URL"
        value = "postgresql://postgres:${var.db_password}@/dojo?host=/cloudsql/${var.project_id}:${var.region}:${google_sql_database_instance.staging.name}"
      }

      env {
        name  = "RATE_LIMIT_REQUESTS"
        value = "1000"
      }

      env {
        name = "ANTHROPIC_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.anthropic_api_key.secret_id
            version = "latest"
          }
        }
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }
    }

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = ["${var.project_id}:${var.region}:${google_sql_database_instance.staging.name}"]
      }
    }
  }

  lifecycle {
    # Image is owned by the deploy workflow (gcloud run deploy).
    ignore_changes = [
      template[0].containers[0].image,
      client,
      client_version,
    ]
  }

  depends_on = [google_secret_manager_secret_version.anthropic_api_key]
}

# Make the Cloud Run service publicly invokable (--allow-unauthenticated).
resource "google_cloud_run_v2_service_iam_member" "public_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
