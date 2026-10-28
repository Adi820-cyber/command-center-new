# ============================================================================
# Orbit Command Center — MySQL Database Setup Script
# Usage:
#   .\database\mysql\setup.ps1 [-Host "127.0.0.1"] [-Port 3306] [-User "root"] [-Password "your_password"]
# ============================================================================

param(
  [string]$HostName = "ecovisrkca-rmt-com.cdeky8oy4qrz.ap-south-1.rds.amazonaws.com",
  [int]$Port = 3306,
  [string]$User = "echo_rmt_user",
  [string]$Password = ""
)

$mysqlExe = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
if (-not (Test-Path $mysqlExe)) {
  $found = Get-Command mysql -ErrorAction SilentlyContinue
  if ($found) {
    $mysqlExe = $found.Source
  } else {
    Write-Error "Could not find mysql.exe. Ensure MySQL 8.0 is installed."
    exit 1
  }
}

$schemaPath = Join-Path $PSScriptRoot "schema.sql"
if (-not (Test-Path $schemaPath)) {
  Write-Error "Schema file not found at: $schemaPath"
  exit 1
}

Write-Host "Setting up Orbit Command Center database in MySQL ($HostName:$Port)..." -ForegroundColor Cyan

$catalogPath = Join-Path $PSScriptRoot "catalog-seed-mysql.sql"

$argsList1 = @("-h", $HostName, "-P", $Port, "-u", $User)
if ($Password) { $argsList1 += "-p$Password" }
$argsList1 += @("-e", "source $schemaPath")

Write-Host "1/2 Creating MySQL tables and auth schema..." -ForegroundColor Cyan
& $mysqlExe $argsList1

if ($LASTEXITCODE -ne 0) {
  Write-Host "MySQL schema initialization failed with exit code $LASTEXITCODE. Please verify credentials." -ForegroundColor Red
  exit $LASTEXITCODE
}

if (Test-Path $catalogPath) {
  Write-Host "2/2 Seeding 623 KPIs, 554 measures, and 21 templates..." -ForegroundColor Cyan
  $argsList2 = @("-h", $HostName, "-P", $Port, "-u", $User)
  if ($Password) { $argsList2 += "-p$Password" }
  $argsList2 += @("-e", "source $catalogPath")
  & $mysqlExe $argsList2
}

if ($LASTEXITCODE -eq 0) {
  Write-Host "MySQL database 'orbit_kpi' initialized and fully seeded successfully!" -ForegroundColor Green
} else {
  Write-Host "MySQL catalog seeding failed with exit code $LASTEXITCODE." -ForegroundColor Red
}
