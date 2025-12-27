variable "project_id" {
  type        = string
  description = "GCP project id."
}

variable "region" {
  type        = string
  description = "Primary region for compute resources."
  default     = "europe-west1"
}

variable "firestore_location" {
  type        = string
  description = "Firestore location id (EU multi-region)."
  default     = "eur3"
}

variable "storage_location" {
  type        = string
  description = "Storage location for buckets."
  default     = "EU"
}

variable "storage_bucket_name" {
  type        = string
  description = "Name for the audio storage bucket."
}
