#!/usr/bin/env pwsh
<#
Open Windows Firewall for the backend port so other devices on the same Wi‑Fi
can reach your dev server.

Default behavior:
  - Reads PORT from the monorepo root .env
  - Falls back to 3001 if not found

Usage (Admin PowerShell):
  .\scripts\open-firewall.ps1
  .\scripts\open-firewall.ps1 -Port 3001
#>

param(
    [int]$Port
)

function Get-BackendPortFromEnvFile {
    param([string]$EnvPath)

    if (-not (Test-Path $EnvPath)) { return $null }

    try {
        $line = (Get-Content $EnvPath -ErrorAction Stop |
            Where-Object { $_ -match '^\s*PORT\s*=\s*\d+\s*$' } |
            Select-Object -First 1)

        if (-not $line) { return $null }
        $raw = (($line -split '=', 2)[1]).Trim()
        $value = [int]$raw
        if ($value -gt 0) { return $value }
    } catch {}

    return $null
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $projectRoot ".env"

if (-not $Port) {
    $Port = Get-BackendPortFromEnvFile -EnvPath $envPath
}

if (-not $Port) {
    $Port = 3001
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🔓 Opening Windows Firewall for Port $Port" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "How to run:" -ForegroundColor Yellow
    Write-Host "  1. Right-click PowerShell -> 'Run as administrator'" -ForegroundColor White
    Write-Host "  2. cd $projectRoot" -ForegroundColor White
    Write-Host "  3. Run: .\scripts\open-firewall.ps1" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Remove old rules (ignore errors)
netsh advfirewall firewall delete rule name="Kusina Konek Backend (Port 3000)" 2>$null | Out-Null
netsh advfirewall firewall delete rule name="Kusina Konek Backend (Port $Port)" 2>$null | Out-Null

# Add new rule for TCP backend port (inbound)
$result = netsh advfirewall firewall add rule `
    name="Kusina Konek Backend (Port $Port)" `
    dir=in `
    action=allow `
    protocol=tcp `
    localport=$Port `
    profile=private

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Firewall rule added successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Other phones on the same WiFi can now connect to your backend." -ForegroundColor White
    Write-Host "Make sure your backend is running on port $Port." -ForegroundColor Yellow
} else {
    Write-Host "❌ Failed to add firewall rule." -ForegroundColor Red
    Write-Host "Output: $result" -ForegroundColor Red
}

Write-Host ""
