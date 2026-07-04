terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
  
  backend "azurerm" {
    # The configuration for this backend will be passed in via CLI arguments
    # during the pipeline execution (e.g. storage_account_name, container_name, key, etc.)
  }
}

provider "azurerm" {
  features {}
}
