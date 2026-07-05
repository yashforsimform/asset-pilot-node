variable "resource_group_name" {
  description = "Name of the Azure Resource Group"
  type        = string
  default     = "prodessy"
}

variable "location" {
  description = "Azure Region"
  type        = string
  default     = "East US"
}

variable "app_name" {
  description = "Base name for the application and related resources"
  type        = string
  default     = "asset-pilot"
}

variable "acr_name" {
  description = "Name of the Azure Container Registry (must be globally unique and alphanumeric)"
  type        = string
  default     = "assetpilotacr2026"
}

variable "docker_image_tag" {
  description = "The tag of the docker image to deploy"
  type        = string
  default     = "latest"
}

variable "db_connection_string" {
  description = "The Database connection string (passed from pipeline variables)"
  type        = string
  sensitive   = true
}

variable "smtp_host" { type = string }
variable "smtp_port" { type = string }
variable "smtp_user" { type = string }
variable "smtp_pass" {
  type      = string
  sensitive = true
}
variable "smtp_from" { type = string }
