[CmdletBinding()]
param(
  [string]$RepoRoot
)

$ErrorActionPreference = 'Stop'

function Write-Step([string]$Message) {
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Stop-NodeProcesses {
  Write-Step 'Stopping node-related processes'
  Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  Get-Process expo -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  Get-Process watchman -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}

function Remove-FolderWithRetry([string]$Path, [int]$Retries = 6, [int]$DelayMs = 600) {
  if (-not (Test-Path -LiteralPath $Path)) {
    Write-Host "Skip (not found): $Path"
    return
  }

  for ($attempt = 1; $attempt -le $Retries; $attempt++) {
    try {
      Write-Step "Removing $Path (attempt $attempt/$Retries)"
      attrib -R "$Path\*" /S /D 2>$null | Out-Null
      Remove-Item -LiteralPath $Path -Recurse -Force
      return
    }
    catch {
      if ($attempt -eq $Retries) { throw }
      Start-Sleep -Milliseconds $DelayMs
    }
  }
}

if (-not $RepoRoot) {
  # scripts/ is expected to be directly under the repo root
  $RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..') | Select-Object -ExpandProperty Path
}

Stop-NodeProcesses

$rootPrisma = Join-Path $RepoRoot 'node_modules\.prisma'
$pkgPrisma = Join-Path $RepoRoot 'packages\database\node_modules\.prisma'

Remove-FolderWithRetry -Path $rootPrisma
Remove-FolderWithRetry -Path $pkgPrisma

Write-Step 'Running prisma generate'
Push-Location (Join-Path $RepoRoot 'packages\database')
try {
  npx prisma generate --schema=prisma\schema.prisma
}
finally {
  Pop-Location
}

Write-Step 'Done'
