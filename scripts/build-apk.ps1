$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$androidRoot = Join-Path $projectRoot 'android'
$artifactRoot = Join-Path $projectRoot 'artifacts'
$artifactPath = Join-Path $artifactRoot 'the-last-alibi-v1.0.0.apk'
$builtApk = Join-Path $androidRoot 'app\build\outputs\apk\release\app-release.apk'

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
  $localAndroidSdk = Join-Path $projectRoot '.android-toolchain\sdk'
  if (-not (Test-Path -LiteralPath $localAndroidSdk)) {
    throw 'Android SDK was not found. Set ANDROID_HOME or provision .android-toolchain/sdk first.'
  }

  $env:ANDROID_HOME = $localAndroidSdk
}

$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:NODE_ENV = 'production'
if (-not $env:GRADLE_USER_HOME) {
  # Keep dependency paths short enough for Windows native build tools.
  $env:GRADLE_USER_HOME = Join-Path $env:LOCALAPPDATA 'la-gradle'
}
$env:GRADLE_OPTS = (($env:GRADLE_OPTS + ' -Dhttps.protocols=TLSv1.2 -Dhttp.keepAlive=false').Trim())
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"

if (-not (Test-Path -LiteralPath $androidRoot)) {
  & npx.cmd expo prebuild --platform android
  if ($LASTEXITCODE -ne 0) { throw "Expo prebuild failed with exit code $LASTEXITCODE." }
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
