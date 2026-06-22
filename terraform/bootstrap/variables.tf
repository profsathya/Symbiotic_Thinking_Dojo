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

variable "state_bucket" {
  description = "GCS bucket holding Terraform remote state"
  type        = string
  default     = "cti-backend-prod-terraform-state"
}

variable "compute_service_account" {
  description = "Default compute service account used as the Cloud Run runtime identity"
  type        = string
  default     = "561867108932-compute@developer.gserviceaccount.com"
}
