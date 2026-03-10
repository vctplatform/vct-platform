param(
  [string]$BackendPath = "./backend",
  [switch]$IncludeRace
)

$ErrorActionPreference = "Stop"

function Invoke-Gate {
  param(
    [string]$Name,
    [scriptblock]$Command
  )

  Write-Host ""
  Write-Host "==> $Name"
  & $Command
  if ($LASTEXITCODE -ne 0) {
    throw "Gate failed: $Name"
  }
}

if (-not (Test-Path $BackendPath)) {
  throw "Backend path does not exist: $BackendPath"
}

Push-Location $BackendPath
try {
  Invoke-Gate "Go version" {
    go version
  }

  Invoke-Gate "gofmt verification" {
    $unformatted = gofmt -l .
    if ($unformatted) {
      Write-Host "Unformatted files:"
      $unformatted | ForEach-Object { Write-Host " - $_" }
      exit 1
    }
  }

  Invoke-Gate "go test ./..." {
    go test ./...
  }

  Invoke-Gate "go vet ./..." {
    go vet ./...
  }

  if ($IncludeRace.IsPresent) {
    Invoke-Gate "go test -race ./..." {
      go test -race ./...
    }
  } else {
    Write-Host ""
    Write-Host "==> go test -race ./... (skipped)"
  }

  Write-Host ""
  Write-Host "All required quality gates passed."
} finally {
  Pop-Location
}
