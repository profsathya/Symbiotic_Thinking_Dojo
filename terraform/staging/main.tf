terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Generate random password for database
resource "random_password" "db_password" {
  length  = 24
  special = true
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
  password = random_password.db_password.result
}
