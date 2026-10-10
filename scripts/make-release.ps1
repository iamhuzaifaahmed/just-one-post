<#
.SYNOPSIS
  Builds a ready-to-upload release zip for cPanel hosting that has NO Node.js.

.DESCRIPTION
  Node is only needed on your own computer to compile the React front end. The server runs PHP only.
  This script:
    1. compiles the front end (npm run build)  -> public/build
    2. copies the project to a temporary folder without dev files (.git, node_modules, tests, .env, uploads, logs)
    3. installs PHP dependencies without dev packages (composer install --no-dev --optimize-autoloader)
    4. zips everything to release/techlo-post-<date>.zip

  Upload the zip with cPanel > File Manager, extract it, then follow "Deploying to cPanel" in the README.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/make-release.ps1
#>
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$stamp = Get-Date -Format 'yyyyMMdd-HHmm'
$stage = Join-Path ([System.IO.Path]::GetTempPath()) "techlo-post-release-$stamp"
$outDir = Join-Path $root 'release'
$zip = Join-Path $outDir "techlo-post-$stamp.zip"

Write-Host "==> 1/4 Building the front end (npm run build)" -ForegroundColor Cyan
Push-Location $root
try {
    if (-not (Test-Path 'node_modules')) { npm ci }
    npm run build
    if ($LASTEXITCODE -ne 0) { throw 'npm run build failed' }
} finally { Pop-Location }

Write-Host "==> 2/4 Copying files to $stage" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $stage | Out-Null
robocopy $root $stage /E /NFL /NDL /NJH /NJS /NP `
    /XD '.git' '.claude' '.idea' '.vscode' 'node_modules' 'vendor' 'tests' 'release' '.phpunit.cache' `
    /XF '.env' '.env.backup' '.env.production' '*.zip' 'hot' '.phpunit.result.cache' 'database.sqlite' | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed ($LASTEXITCODE)" }

# Runtime folders must exist, but without local content (logs, sessions, uploads, caches).
foreach ($d in 'storage\logs', 'storage\framework\cache\data', 'storage\framework\sessions', 'storage\framework\views', 'storage\framework\testing', 'storage\app\public', 'bootstrap\cache') {
    $p = Join-Path $stage $d
    if (Test-Path $p) { Get-ChildItem $p -Force -Recurse -File | Where-Object { $_.Name -ne '.gitignore' } | Remove-Item -Force }
    New-Item -ItemType Directory -Force -Path $p | Out-Null
}
Remove-Item (Join-Path $stage 'public\storage') -Force -Recurse -ErrorAction SilentlyContinue   # local symlink
Remove-Item (Join-Path $stage 'storage\app\installed.lock') -Force -ErrorAction SilentlyContinue   # the installer lock of THIS machine
Remove-Item (Join-Path $stage 'public\hot') -Force -ErrorAction SilentlyContinue

Write-Host "==> 3/4 Installing PHP dependencies (no dev packages)" -ForegroundColor Cyan
Push-Location $stage
try {
    composer install --no-dev --optimize-autoloader --no-interaction --no-scripts
    if ($LASTEXITCODE -ne 0) { throw 'composer install failed' }
} finally { Pop-Location }

Write-Host "==> 4/4 Creating $zip" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
if (Test-Path $zip) { Remove-Item $zip -Force }
# tar (built into Windows 10/11) writes proper forward-slash paths, unlike Compress-Archive in Windows PowerShell 5.1
# List the top-level items explicitly so entries have no "./" prefix (-Force includes .htaccess, .env.example).
$items = Get-ChildItem $stage -Force | ForEach-Object { $_.Name }
tar -a -c -f $zip -C $stage @items
if ($LASTEXITCODE -ne 0) { throw 'zip creation failed' }

Remove-Item $stage -Recurse -Force
$size = [math]::Round((Get-Item $zip).Length / 1MB, 1)
Write-Host ""
Write-Host "Done: $zip ($size MB)" -ForegroundColor Green
Write-Host "Next: upload and extract it on the server, copy .env.example to .env, then see 'Deploying to cPanel' in README.md."
