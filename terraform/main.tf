data "azurerm_resource_group" "rg" {
  name = var.resource_group_name
}

# Azure Container Registry
resource "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = data.azurerm_resource_group.rg.name
  location            = data.azurerm_resource_group.rg.location
  sku                 = "Basic"
  admin_enabled       = true
}

# App Service Plan (Linux)
resource "azurerm_service_plan" "app_plan" {
  name                = "asp-${var.app_name}"
  resource_group_name = data.azurerm_resource_group.rg.name
  location            = data.azurerm_resource_group.rg.location
  os_type             = "Linux"
  sku_name            = "B1"
}

# App Service (Web App for Containers)
resource "azurerm_linux_web_app" "app" {
  name                = "app-${var.app_name}"
  resource_group_name = data.azurerm_resource_group.rg.name
  location            = data.azurerm_resource_group.rg.location
  service_plan_id     = azurerm_service_plan.app_plan.id

  site_config {
    application_stack {
      docker_image_name   = "${var.app_name}:${var.docker_image_tag}"
      docker_registry_url = "https://${azurerm_container_registry.acr.login_server}"
      docker_registry_username = azurerm_container_registry.acr.admin_username
      docker_registry_password = azurerm_container_registry.acr.admin_password
    }
    always_on = true
  }

  app_settings = {
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "false"
    "DOCKER_REGISTRY_SERVER_URL"          = "https://${azurerm_container_registry.acr.login_server}"
    "DOCKER_REGISTRY_SERVER_USERNAME"      = azurerm_container_registry.acr.admin_username
    "DOCKER_REGISTRY_SERVER_PASSWORD"      = azurerm_container_registry.acr.admin_password
    "DATABASE_URL"                        = var.db_connection_string
    "NODE_ENV"                            = "production"
    "PORT"                                = "3000"
    "WEBSITES_PORT"                       = "3000"
  }

  identity {
    type = "SystemAssigned"
  }
}
