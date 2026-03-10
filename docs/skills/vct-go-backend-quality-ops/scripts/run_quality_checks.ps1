param(
    [string]$BackendPath = "./backend",
    [switch]$SkipRace
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$script:HadFailure = $false

function Invoke-Step {
    param(
        [string]$Name,
        [scriptblock]$Action
    )

    Write-Host "==> $Name"
    try {
        & $Action
        Write-Host "PASS: $Name`n"
    }
    catch {
        Write-Host "FAIL: $Name"
        Write-Host $_.Exception.Message
        Write-Host ""
        $script:HadFailure = $true
    }
}

$resolvedBackendPath = Resolve-Path -Path $BackendPath
Push-Location $resolvedBackendPath

try {
    if (-not (Get-Command go -ErrorAction SilentlyContinue)) {
        throw "Cannot find 'go' in PATH. Install Go 1.26.x and retry."
    }

    $goVersion = (& go env GOVERSION).Trim()
    Write-Host "Detected Go version: $goVersion"
    if (-not $goVersion.StartsWith("go1.26")) {
        Write-Warning "Expected Go 1.26.x. Continue with caution."
    }

    [string[]]$goFiles = @(
        Get-ChildItem -Path . -Recurse -File -Filter "*.go" |
            Where-Object { $_.FullName -notmatch "[\\/]vendor[\\/]" } |
            ForEach-Object { $_.FullName }
    )

    Invoke-Step -Name "Check gofmt" -Action {
        if ($goFiles.Count -eq 0) {
            Write-Host "No Go files found."
            return
        }

        [string[]]$unformatted = @(& gofmt -l $goFiles)
        if ($LASTEXITCODE -ne 0) {
            throw "gofmt failed with exit code $LASTEXITCODE"
        }
        if ($unformatted.Count -gt 0) {
            throw ("Unformatted files:`n" + ($unformatted -join "`n"))
        }
    }

    Invoke-Step -Name "go test ./..." -Action {
        & go test ./...
        if ($LASTEXITCODE -ne 0) {
            throw "go test failed with exit code $LASTEXITCODE"
        }
    }

    Invoke-Step -Name "go vet ./..." -Action {
        & go vet ./...
        if ($LASTEXITCODE -ne 0) {
            throw "go vet failed with exit code $LASTEXITCODE"
        }
    }

    $cgoEnabled = (& go env CGO_ENABLED).Trim()
    if (-not $SkipRace -and $cgoEnabled -ne "1") {
        Write-Warning "Skipping race check because CGO_ENABLED=$cgoEnabled. Use CGO_ENABLED=1 to enable -race."
        $SkipRace = $true
    }

    if (-not $SkipRace) {
        Invoke-Step -Name "go test -race ./..." -Action {
            & go test -race ./...
            if ($LASTEXITCODE -ne 0) {
                throw "go test -race failed with exit code $LASTEXITCODE"
            }
        }
    }
    else {
        Write-Host "Skipped race check."
    }
}
finally {
    Pop-Location
}

if ($script:HadFailure) {
    Write-Host "One or more quality gates failed."
    exit 1
}

Write-Host "All quality gates passed."
exit 0
