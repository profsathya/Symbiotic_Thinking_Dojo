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
  description = "Database password for existing instance"
  type        = string
  sensitive   = true
}

variable "anthropic_api_key" {
  description = "Anthropic API key value stored in Secret Manager (anthropic-api-key-staging)"
  type        = string
  sensitive   = true
}
