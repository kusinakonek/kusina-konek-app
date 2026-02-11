#!/usr/bin/env pwsh
# ============================================
# DEPRECATED: This script has moved
# ============================================
# 
# Environment configuration is now centralized in the root .env file.
# Please use the new setup script from the root:
#
#   ..\..\scripts\setup-dev-env.ps1
#
# Or run from the root directory:
#   cd ../..
#   .\scripts\setup-dev-env.ps1
#
# ============================================

Write-Host "" -ForegroundColor Yellow
Write-Host "⚠️  This script has been deprecated" -ForegroundColor Yellow
Write-Host "" -ForegroundColor Yellow
Write-Host "Environment configuration is now centralized in the root .env file." -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "Please use the new setup script:" -ForegroundColor Cyan
Write-Host "  cd ../.." -ForegroundColor White
Write-Host "  .\scripts\setup-dev-env.ps1" -ForegroundColor White
Write-Host "" -ForegroundColor White

$response = Read-Host "Would you like to run the new script now? (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    Push-Location ../..
    & .\scripts\setup-dev-env.ps1
    Pop-Location
} else {
    Write-Host "You can run it manually from the root directory." -ForegroundColor Gray
}
