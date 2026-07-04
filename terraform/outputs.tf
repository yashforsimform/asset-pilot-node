output "resource_group_name" {
  value = data.azurerm_resource_group.rg.name
}

output "acr_login_server" {
  value = azurerm_container_registry.acr.login_server
}

output "acr_admin_username" {
  value     = azurerm_container_registry.acr.admin_username
  sensitive = true
}

output "app_service_name" {
  value = azurerm_linux_web_app.app.name
}

output "app_service_default_hostname" {
  value = azurerm_linux_web_app.app.default_hostname
}
