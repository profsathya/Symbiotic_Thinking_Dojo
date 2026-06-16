output "database_connection_name" {
  description = "Cloud SQL connection name"
  value       = google_sql_database_instance.staging.connection_name
}

output "database_instance_name" {
  description = "Cloud SQL instance name"
  value       = google_sql_database_instance.staging.name
}

output "service_account_email" {
  description = "GitHub Actions service account email"
  value       = google_service_account.github_actions.email
}

output "service_account_key" {
  description     = "GitHub Actions service account key (base64 encoded)"
  value           = google_service_account_key.github_actions.private_key
  sensitive       = true
}
