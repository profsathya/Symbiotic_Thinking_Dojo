variable "project_id" {
  description = "GCP project ID"
  type        = string
  default     = "cti-backend-prod"
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "db_password" {
  description = "Database password for the Cloud SQL instance"
  type        = string
  sensitive   = true
}

variable "anthropic_api_key" {
  description = "Anthropic API key value stored in Secret Manager (anthropic-api-key-staging)"
  type        = string
  sensitive   = true
}

variable "compute_service_account" {
  description = "Compute service account used as the Cloud Run runtime identity"
  type        = string
  default     = "561867108932-compute@developer.gserviceaccount.com"
}

variable "image" {
  description = "Initial container image for the Cloud Run service. Subsequent images are managed by the deploy workflow (ignored by Terraform)."
  type        = string
  default     = "gcr.io/cti-backend-prod/dojo-backend-staging:latest"
}
