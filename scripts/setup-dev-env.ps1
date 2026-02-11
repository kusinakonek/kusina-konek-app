#!/usr/bin/env pwsh
# Script to automatically detect and configure your local IP for development
# This updates the root .env file with your current machine's IP address

Write-Host "🔍 Detecting your local IP address..." -ForegroundColor Cyan

# Get the IP address
$ipAddress = Get-NetIPAddress -AddressFamily IPv4 | 
    Where-Object { $_.InterfaceAlias -notlike '*Loopback*' -and $_.IPAddress -notlike '169.254.*' } | 
    Select-Object -First 1 -ExpandProperty IPAddress

if ($ipAddress) {
    Write-Host "✅ Found IP: $ipAddress" -ForegroundColor Green
    
    # Root .env file
    $rootDir = Split-Path -Parent $PSScriptRoot
    $envFile = Join-Path $rootDir ".env"
    
    if (Test-Path $envFile) {
        # Update existing .env file
        $content = Get-Content $envFile -Raw
        if ($content -match 'EXPO_PUBLIC_API_HOST=') {
            $newContent = $content -replace 'EXPO_PUBLIC_API_HOST=.*', "EXPO_PUBLIC_API_HOST=$ipAddress"
            $newContent | Set-Content $envFile -NoNewline
            Write-Host "✅ Updated .env file with new IP address" -ForegroundColor Green
        } else {
            # Add the mobile configuration if it doesn't exist
            $mobileConfig = @"

# Mobile App API Configuration
EXPO_PUBLIC_API_HOST=$ipAddress
EXPO_PUBLIC_API_PORT=3000
"@
            Add-Content $envFile $mobileConfig
            Write-Host "✅ Added mobile configuration to .env file" -ForegroundColor Green
        }
    } else {
        # Create new .env from .env.example
        $exampleFile = Join-Path $rootDir ".env.example"
        if (Test-Path $exampleFile) {
            $content = Get-Content $exampleFile -Raw
            $newContent = $content -replace 'EXPO_PUBLIC_API_HOST=.*', "EXPO_PUBLIC_API_HOST=$ipAddress"
            $newContent | Set-Content $envFile -NoNewline
            Write-Host "✅ Created .env file from template" -ForegroundColor Green
        } else {
            Write-Host "⚠️  No .env.example found. Please create one first." -ForegroundColor Yellow
            exit 1
        }
    }
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "✨ Setup Complete!" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📱 Mobile app will connect to: " -NoNewline -ForegroundColor White
    Write-Host "http://${ipAddress}:3000/api" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Make sure your backend server is running" -ForegroundColor White
    Write-Host "  2. Restart your Expo development server if it's already running" -ForegroundColor White
    Write-Host "  3. Ensure your device/emulator is on the same network" -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host "❌ Could not detect your IP address" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please manually find your IP and update EXPO_PUBLIC_API_HOST in .env" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To find your IP:" -ForegroundColor Cyan
    Write-Host "  ipconfig" -ForegroundColor White
    Write-Host "  (Look for IPv4 Address under your WiFi/Ethernet adapter)" -ForegroundColor Gray
    Write-Host ""
}
