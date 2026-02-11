#!/usr/bin/env pwsh
# Script to automatically detect and configure your local IP for development
# This updates the root .env file with your current machine's IP address

Write-Host "[*] Detecting your local IP address..." -ForegroundColor Cyan

# Get the best IP address (prefer WiFi over hotspot/virtual adapters)
# Priority: Wi-Fi > Ethernet > any other non-loopback
$allIps = Get-NetIPAddress -AddressFamily IPv4 | 
    Where-Object { 
        $_.IPAddress -notlike '127.*' -and 
        $_.IPAddress -notlike '169.254.*' -and
        $_.InterfaceAlias -notlike '*Loopback*' -and
        $_.InterfaceAlias -notlike '*vEthernet*' -and
        $_.InterfaceAlias -notlike '*Virtual*'
    }

# Try Wi-Fi first (but not hotspot - hotspot IPs are typically 192.168.137.x)
$wifiIp = $allIps | Where-Object { 
    $_.InterfaceAlias -like '*Wi-Fi*' -and $_.IPAddress -notlike '192.168.137.*'
} | Select-Object -First 1

# Then try Ethernet
$ethIp = $allIps | Where-Object { $_.InterfaceAlias -like '*Ethernet*' } | Select-Object -First 1

# Then try Wireless
$wirelessIp = $allIps | Where-Object { $_.InterfaceAlias -like '*Wireless*' } | Select-Object -First 1

# Pick the best one
if ($wifiIp) {
    $ipAddress = $wifiIp.IPAddress
    $adapter = $wifiIp.InterfaceAlias
} elseif ($ethIp) {
    $ipAddress = $ethIp.IPAddress
    $adapter = $ethIp.InterfaceAlias
} elseif ($wirelessIp) {
    $ipAddress = $wirelessIp.IPAddress
    $adapter = $wirelessIp.InterfaceAlias
} else {
    $fallback = $allIps | Select-Object -First 1
    if ($fallback) {
        $ipAddress = $fallback.IPAddress
        $adapter = $fallback.InterfaceAlias
    }
}

if ($ipAddress) {
    Write-Host "[+] Found IP: $ipAddress" -ForegroundColor Green
    
    # Root .env file
    $rootDir = Split-Path -Parent $PSScriptRoot
    $envFile = Join-Path $rootDir ".env"
    
    if (Test-Path $envFile) {
        $content = Get-Content $envFile -Raw
        if ($content -match 'EXPO_PUBLIC_API_HOST=') {
            $newContent = $content -replace 'EXPO_PUBLIC_API_HOST=.*', "EXPO_PUBLIC_API_HOST=$ipAddress"
            $newContent | Set-Content $envFile -NoNewline
            Write-Host "[+] Updated .env file with new IP address" -ForegroundColor Green
        } else {
            $mobileConfig = @"

# Mobile App API Configuration
EXPO_PUBLIC_API_HOST=$ipAddress
EXPO_PUBLIC_API_PORT=3000
"@
            Add-Content $envFile $mobileConfig
            Write-Host "[+] Added mobile configuration to .env file" -ForegroundColor Green
        }
    } else {
        $exampleFile = Join-Path $rootDir ".env.example"
        if (Test-Path $exampleFile) {
            $content = Get-Content $exampleFile -Raw
            $newContent = $content -replace 'EXPO_PUBLIC_API_HOST=.*', "EXPO_PUBLIC_API_HOST=$ipAddress"
            $newContent | Set-Content $envFile -NoNewline
            Write-Host "[+] Created .env file from template" -ForegroundColor Green
        } else {
            Write-Host "[!] No .env.example found. Please create one first." -ForegroundColor Yellow
            exit 1
        }
    }
    
    # Check if firewall is open for port 3000
    Write-Host ""
    $firewallRule = netsh advfirewall firewall show rule name="Kusina Konek Backend (Port 3000)" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Firewall WARNING:" -ForegroundColor Yellow
        Write-Host "   Port 3000 is NOT open in Windows Firewall!" -ForegroundColor Yellow
        Write-Host "   Other phones may not be able to connect." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   To fix, run AS ADMINISTRATOR:" -ForegroundColor Cyan
        Write-Host "   .\scripts\open-firewall.ps1" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "✅ Firewall: Port 3000 is open" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "Setup Complete!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Mobile app will connect to: " -NoNewline -ForegroundColor White
    Write-Host "http://${ipAddress}:3000/api" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Open firewall if not done: .\scripts\open-firewall.ps1 (as admin)" -ForegroundColor White
    Write-Host "  2. Start the backend:  cd apps/server && npm run dev" -ForegroundColor White
    Write-Host "  3. Start the mobile:   cd apps/mobile && npx expo start --clear" -ForegroundColor White
    Write-Host "  4. Connect phones to the SAME WiFi as this computer" -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host "[X] Could not detect your IP address" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please manually find your IP and update EXPO_PUBLIC_API_HOST in .env" -ForegroundColor Yellow
    Write-Host "  ipconfig  (Look for IPv4 Address under Wi-Fi adapter)" -ForegroundColor Gray
    Write-Host ""
}
