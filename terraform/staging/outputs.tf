output "database_connection_name" {
  description = "Cloud SQL connection name"
  value       = google_sql_database_instance.staging.connection_name
}

output "database_instance_name" {
  description = "Cloud SQL instance name"
  value       = google_sql_database_instance.staging.name
}

output "service_url" {
  description = "Cloud Run service URL"
  value       = google_cloud_run_v2_service.backend.uri
}
