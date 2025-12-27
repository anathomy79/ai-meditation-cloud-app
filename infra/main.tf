terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

resource "google_firestore_database" "default" {
  name        = "(default)"
  location_id = var.firestore_location
  type        = "FIRESTORE_NATIVE"
}

resource "google_storage_bucket" "audio" {
  name                        = var.storage_bucket_name
  location                    = var.storage_location
  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }
}
