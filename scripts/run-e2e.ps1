<#
.SYNOPSIS
  Runs the browser end-to-end tests against a disposable Docker stack.

.DESCRIPTION
  Starts web + API + PostgreSQL as the separate Compose project "droneaid-e2e" (web on
  http://localhost:4210, its own database volume), waits until the API answers, runs the
  Playwright tests in e2e/, then removes the stack and its data. The development stack
  (port 4200, project "droneaidwarehouse") and its database are never touched.

.PARAMETER KeepStack
  Leave the e2e stack running afterwards (for debugging; remove it with -Down).

.PARAMETER Down
  Only remove the e2e stack and its volume, then exit.

.PARAMETER NoStack
  Do not start or stop any stack; test whatever E2E_BASE_URL points to.

.PARAMETER PlaywrightArgs
  Extra arguments for "playwright test", for example: -g "diagram" or --headed.

.EXAMPLE
  ./scripts/run-e2e.ps1
  ./scripts/run-e2e.ps1 -PlaywrightArgs '--headed','-g','diagram'
#>
[CmdletBinding()]
param(
    [switch]$KeepStack,
    [switch]$Down,
    [switch]$NoStack,
    [string[]]$PlaywrightArgs = @()
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$project = 'droneaid-e2e'
$compose = @('compose', '-p', $project, '-f', 'compose.yaml', '-f', 'compose.e2e.yaml')

# The e2e database is disposable, so it gets its own throwaway password (not the one in .env).
if (-not $env:POSTGRES_PASSWORD) { $env:POSTGRES_PASSWORD = 'e2e-disposable-password' }

function Remove-E2eStack {
    Push-Location $repoRoot
    try { docker @compose down -v --remove-orphans } finally { Pop-Location }
}

if ($Down) { Remove-E2eStack; exit 0 }

$exitCode = 1
Push-Location $repoRoot
try {
    if (-not $NoStack) {
        Write-Host "Starting the e2e stack ($project, http://localhost:4210)..."
        docker @compose up --build -d
        if ($LASTEXITCODE -ne 0) { throw 'docker compose up failed.' }

        $baseUrl = 'http://localhost:4210'
        $ready = $false
        for ($i = 0; $i -lt 60 -and -not $ready; $i++) {
            try {
                $ready = (Invoke-WebRequest "$baseUrl/api/drones/summary" -UseBasicParsing -TimeoutSec 3).StatusCode -eq 200
            } catch { Start-Sleep -Seconds 2 }
        }
        if (-not $ready) { throw "The e2e stack did not become ready at $baseUrl." }
    }

    Push-Location (Join-Path $repoRoot 'e2e')
    try {
        if (-not (Test-Path 'node_modules')) { npm ci }
        npx playwright test @PlaywrightArgs
        $exitCode = $LASTEXITCODE
    } finally { Pop-Location }
}
finally {
    Pop-Location
    if (-not $NoStack -and -not $KeepStack) {
        Write-Host 'Removing the e2e stack and its data...'
        Remove-E2eStack
    }
}
exit $exitCode
