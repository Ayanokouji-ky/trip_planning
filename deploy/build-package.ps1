# ==========================================================================
# Build the deployment package (run on Windows host).
# Output: dist-packages/trip-planner-deploy.tar.gz
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\deploy\build-package.ps1
#   powershell -ExecutionPolicy Bypass -File .\deploy\build-package.ps1 -SkipBuild
# ==========================================================================
param(
  [switch]$SkipBuild,
  # Local JDK 8 home (Spring Boot 2.7 must be compiled with JDK 8)
  [string]$Jdk8Home = "C:\Program Files\Eclipse Adoptium\jdk-8.0.504.1-hotspot"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$stage = Join-Path $root "dist-packages\trip-planner-deploy"
$outDir = Join-Path $root "dist-packages"

if (-not $SkipBuild) {
  # ---------- 1. Backend fat jar (JDK 8) ----------
  if (-not (Test-Path (Join-Path $Jdk8Home "bin\javac.exe"))) {
    throw "JDK 8 not found, pass it with -Jdk8Home: $Jdk8Home"
  }
  $env:JAVA_HOME = $Jdk8Home
  $env:Path = "$Jdk8Home\bin;$env:Path"
  Write-Host "==> [1/2] Maven build backend (JDK8)..." -ForegroundColor Cyan
  Push-Location (Join-Path $root "backend")
  try {
    & .\mvnw.cmd -s ..\settings\settings.xml "-Dmaven.repo.local=..\.m2\repository" clean package -DskipTests
    if ($LASTEXITCODE -ne 0) { throw "backend build failed" }
  }
  finally { Pop-Location }

  # ---------- 2. Frontend static assets ----------
  Write-Host "==> [2/2] Vite build frontend..." -ForegroundColor Cyan
  Push-Location (Join-Path $root "frontend")
  try {
    & "C:\Program Files\nodejs\npm.cmd" run build
    if ($LASTEXITCODE -ne 0) { throw "frontend build failed" }
  }
  finally { Pop-Location }
}

# ---------- 3. Stage deployment directory ----------
Write-Host "==> Staging deployment files..." -ForegroundColor Cyan
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Force -Path $stage,
  "$stage\backend", "$stage\frontend", "$stage\frontend\nginx" | Out-Null

Copy-Item "$root\deploy\docker-compose.yml" "$stage\"
Copy-Item "$root\deploy\.env.example" "$stage\"
Copy-Item "$root\deploy\DEPLOY.md" "$stage\"
Copy-Item "$root\deploy\backend\Dockerfile" "$stage\backend\"
Copy-Item "$root\deploy\frontend\Dockerfile" "$stage\frontend\"
Copy-Item "$root\deploy\frontend\nginx\default.conf" "$stage\frontend\nginx\"

$jar = Get-ChildItem "$root\backend\target\trip-planner-backend-*.jar" |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $jar) { throw "backend jar not found, run a full build without -SkipBuild" }
Copy-Item $jar.FullName "$stage\backend\app.jar"

if (-not (Test-Path "$root\frontend\dist\index.html")) {
  throw "frontend dist not found, run a full build without -SkipBuild"
}
Copy-Item "$root\frontend\dist" "$stage\frontend\dist" -Recurse

# ---------- 4. Create tar.gz (Linux-ready) ----------
$tar = "$outDir\trip-planner-deploy.tar.gz"
if (Test-Path $tar) { Remove-Item $tar -Force }
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
Push-Location $outDir
try {
  & tar.exe -czf trip-planner-deploy.tar.gz trip-planner-deploy
  if ($LASTEXITCODE -ne 0) { throw "tar failed" }
}
finally { Pop-Location }

$size = [math]::Round((Get-Item $tar).Length / 1MB, 1)
Write-Host "==> Done: $tar ($size MB)" -ForegroundColor Green
