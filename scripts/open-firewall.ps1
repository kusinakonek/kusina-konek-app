#!/usr/bin/env pwsh
# Run this script AS ADMINISTRATOR to open port 3000 for the backend server
# This allows other phones on the same WiFi to connect to your backend
#
# Right-click PowerShell -> "Run as administrator" -> then run this script

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🔓 Opening Windows Firewall for Port 3000" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "How to run:" -ForegroundColor Yellow
    Write-Host "  1. Right-click PowerShell -> 'Run as administrator'" -ForegroundColor White
    Write-Host "  2. Navigate to project root" -ForegroundColor White
    Write-Host "  3. Run: .\scripts\open-firewall.ps1" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Remove old rule if exists (ignore errors)
netsh advfirewall firewall delete rule name="Kusina Konek Backend (Port 3000)" 2>$null | Out-Null

# Add new rule for TCP port 3000 (inbound)
$result = netsh advfirewall firewall add rule `
    name="Kusina Konek Backend (Port 3000)" `
    dir=in `
    action=allow `
    protocol=tcp `
    localport=3000 `
    profile=private

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Firewall rule added successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Other phones on the same WiFi can now connect to your backend." -ForegroundColor White
    Write-Host "Make sure to restart your backend server after this." -ForegroundColor Yellow
} else {
    Write-Host "❌ Failed to add firewall rule." -ForegroundColor Red
    Write-Host "Output: $result" -ForegroundColor Red
}

Write-Host ""
