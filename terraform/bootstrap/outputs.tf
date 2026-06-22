output "service_account_email" {
  description = "GitHub Actions service account email"
  value       = google_service_account.github_actions.email
}

output "enabled_apis" {
  description = "APIs enabled for the project"
  value       = sort([for s in google_project_service.apis : s.service])
}
