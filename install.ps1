#!/usr/bin/env pwsh
# Zein Windows Installer
#Requires -Version 5.1

$Version = "0.1.0"
$InstallDir = "$env:LOCALAPPDATA\zein"
$BuildDir = "$InstallDir\zeinc-build"

function Info  { Write-Host "[zein] $args" -ForegroundColor Green }
function Warn  { Write-Host "[zein] $args" -ForegroundColor Yellow }
function Err   { Write-Host "[zein] $args" -ForegroundColor Red; exit 1 }

function Detect-Node {
  try {
    $v = node --version 2>$null
    if ($v -match "v(\d+)\.\d+\.\d+") {
      $major = [int]$Matches[1]
      if ($major -ge 18) { return $true }
      else { Warn "Node.js $v found, but 18+ required"; return $false }
    }
  } catch {}
  return $false
}

function Add-ToPath {
  $paths = [Environment]::GetEnvironmentVariable("Path", "User") -split ";"
  if ($paths -notcontains $InstallDir) {
    $newPath = "$InstallDir;" + [Environment]::GetEnvironmentVariable("Path", "User")
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    $env:Path = "$InstallDir;$env:Path"
    Info "added $InstallDir to PATH"
  }
}

function Build-Compiler {
  Info "building Zein $Version from source..."
  Set-Location $PSScriptRoot

  gleam clean 2>$null
  gleam build
  if ($LASTEXITCODE -ne 0) { Err "Gleam build (Erlang) failed" }
  gleam test
  if ($LASTEXITCODE -ne 0) { Err "Gleam tests failed" }

  gleam build --target javascript
  if ($LASTEXITCODE -ne 0) { Err "Gleam build (JS) failed" }

  gleam export escript
  if ($LASTEXITCODE -ne 0) { Err "Gleam escript export failed" }
  Move-Item -Force zein zeinc.escript 2>$null
}

function Install-Files {
  Info "installing to $InstallDir ..."
  Remove-Item -Recurse -Force "$InstallDir" -ErrorAction SilentlyContinue
  New-Item -ItemType Directory -Force "$InstallDir" | Out-Null

  Copy-Item -Recurse "$PSScriptRoot\zeinc-build\*" "$BuildDir\" -ErrorAction Stop

  $PSScriptRoot\zeinc.escript | Copy-Item -Destination "$InstallDir\zeinc.escript"

  @"
#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const { main } = await import(join(__dirname, 'zeinc-build/zein/zein.mjs'));
  main();
} catch (e) {
  const { execFileSync } = await import('child_process');
  try {
    execFileSync(join(__dirname, 'zeinc.escript'), process.argv.slice(2), { stdio: 'inherit' });
  } catch { process.exit(1); }
}
"@ | Out-File -FilePath "$InstallDir\zeinc" -Encoding utf8

  @"
@echo off
node "%~dp0zeinc" %*
"@ | Out-File -FilePath "$InstallDir\zeinc.cmd" -Encoding ascii

  @"
@echo off
node "%~dp0zeinc" --compile %* 2>nul
if errorlevel 1 (
  node "%~dp0zeinc" %*
  exit /b %errorlevel%
)
"@ | Out-File -FilePath "$InstallDir\zein.cmd" -Encoding ascii

  Info "installed: zeinc, zeinc.cmd, zein.cmd, zeinc-build/"
}

# ── Main ──────────────────────────────────────────────────────────

Write-Host "Zein v$Version Windows Installer" -ForegroundColor Cyan
Write-Host ""

if (-not (Detect-Node)) {
  Warn "Node.js 18+ is required"
  Warn "download from: https://nodejs.org/"
  $ans = Read-Host "continue anyway? (y/N)"
  if ($ans -ne "y") { exit 1 }
}

$hasGleam = $false
try { gleam --version 2>$null | Out-Null; $hasGleam = $true } catch {}
if (-not $hasGleam) {
  Warn "Gleam is required to build from source"
  Warn "install via: winget install gleam"
  $ans = Read-Host "continue anyway? (y/N)"
  if ($ans -ne "y") { exit 1 }
}

try {
  Build-Compiler
} catch {
  Err "build failed: $_"
}

try {
  Install-Files
  Add-ToPath
} catch {
  Err "install failed: $_"
}

Write-Host ""
Info "Zein $Version installed!"
Info "  zein --help"
Info "  zein hello.zn"
Write-Host ""
Warn "restart your terminal or run:  `$env:Path = `"$InstallDir;`$env:Path`""
