$ErrorActionPreference = "Stop"

# Build the web assets with Node.js v22 when available.
# This avoids known Windows issues with some newer Node builds.

$node22 = "D:\nodejs-v22\node.exe"
$node22Bin = "D:\nodejs-v22"

if (Test-Path -LiteralPath $node22) {
    $nodeExe = $node22
    $env:PATH = "$node22Bin;$env:PATH"
} else {
    $nodeExe = "node"
}

Write-Host "Using Node:" -ForegroundColor Cyan
& $nodeExe --version

$projectRoot = $PSScriptRoot
$webDir = Join-Path $projectRoot "web"
$viteBin = Join-Path $webDir "node_modules\vite\bin\vite.js"

if (-not (Test-Path -LiteralPath $viteBin)) {
    Write-Error "Vite was not found. Please run dependency install first."
    exit 1
}

Push-Location $webDir
try {
    & $nodeExe $viteBin build
    $exitCode = $LASTEXITCODE
} finally {
    Pop-Location
}

if ($exitCode -eq 0) {
    Write-Host "Web build completed." -ForegroundColor Green
} else {
    Write-Error "Web build failed. Exit code: $exitCode"
}

exit $exitCode
