$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$androidRoot = Join-Path $projectRoot 'android'
$artifactRoot = Join-Path $projectRoot 'artifacts'
$package = Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'package.json') | ConvertFrom-Json
$artifactPath = Join-Path $artifactRoot "the-last-alibi-v$($package.version).apk"
$builtApk = Join-Path $androidRoot 'app\build\outputs\apk\release\app-release.apk'
$minimumFreeBytes = 8GB
$projectDrive = [System.IO.DriveInfo]::new([System.IO.Path]::GetPathRoot($projectRoot))

if ($projectDrive.AvailableFreeSpace -lt $minimumFreeBytes) {
  $freeGb = [Math]::Round($projectDrive.AvailableFreeSpace / 1GB, 1)
  throw "A clean Android build needs at least 8 GB free on $($projectDrive.Name). Only $freeGb GB is available."
}

if (-not $env:JAVA_HOME -or -not (Test-Path -LiteralPath (Join-Path $env:JAVA_HOME 'bin\java.exe'))) {
  $localJdk = Get-ChildItem -Path (Join-Path $projectRoot '.android-toolchain\jdk17') -Directory -ErrorAction SilentlyContinue |
    Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName 'bin\java.exe') } |
    Select-Object -First 1

  if (-not $localJdk) {
    throw 'JDK 17+ was not found. Set JAVA_HOME or provision .android-toolchain/jdk17 first.'
  }

  $env:JAVA_HOME = $localJdk.FullName
}

if (-not $env:ANDROID_HOME -or -not (Test-Path -LiteralPath $env:ANDROID_HOME)) {
  $standardAndroidSdk = if ($env:LOCALAPPDATA) { Join-Path $env:LOCALAPPDATA 'Android\Sdk' } else { $null }
  $localAndroidSdk = Join-Path $projectRoot '.android-toolchain\sdk'
  if ($standardAndroidSdk -and (Test-Path -LiteralPath $standardAndroidSdk)) {
    $env:ANDROID_HOME = $standardAndroidSdk
  }
  elseif (Test-Path -LiteralPath $localAndroidSdk) {
    $env:ANDROID_HOME = $localAndroidSdk
  }
  else {
    throw 'Android SDK was not found. Set ANDROID_HOME or provision .android-toolchain/sdk first.'
  }
}

$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:NODE_ENV = 'production'
if (-not $env:SENTRY_ORG -or -not $env:SENTRY_PROJECT -or -not $env:SENTRY_AUTH_TOKEN) {
  $env:SENTRY_DISABLE_AUTO_UPLOAD = 'true'
}
if (-not $env:GRADLE_USER_HOME) {
  # Reuse Gradle's standard cache and keep native dependency paths short.
  $env:GRADLE_USER_HOME = Join-Path $env:USERPROFILE '.gradle'
}
$env:GRADLE_OPTS = (($env:GRADLE_OPTS + ' -Dhttps.protocols=TLSv1.2 -Dhttp.keepAlive=false').Trim())
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"

Push-Location $projectRoot
try {
  & npx.cmd expo prebuild --platform android --no-install
  if ($LASTEXITCODE -ne 0) { throw "Expo prebuild failed with exit code $LASTEXITCODE." }
}
finally {
  Pop-Location
}

Push-Location $androidRoot
try {
  & .\gradlew.bat assembleRelease '-PreactNativeArchitectures=arm64-v8a' --no-daemon --no-build-cache --no-parallel --max-workers=1
  if ($LASTEXITCODE -ne 0) { throw "Gradle build failed with exit code $LASTEXITCODE." }
}
finally {
  Pop-Location
}

if (-not (Test-Path -LiteralPath $builtApk)) {
  throw "Gradle completed without producing the expected APK: $builtApk"
}

New-Item -ItemType Directory -Force -Path $artifactRoot | Out-Null
Copy-Item -LiteralPath $builtApk -Destination $artifactPath -Force

$artifact = Get-Item -LiteralPath $artifactPath
$hash = (Get-FileHash -LiteralPath $artifactPath -Algorithm SHA256).Hash
Write-Output "APK: $($artifact.FullName)"
Write-Output "Size: $($artifact.Length) bytes"
Write-Output "SHA-256: $hash"
