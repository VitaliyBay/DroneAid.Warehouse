$ErrorActionPreference = 'Stop'

git config core.hooksPath .githooks
Write-Host 'Repository Git hooks are enabled.'
