#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
android_root="$project_root/android"
artifact_root="$project_root/artifacts"
version="$(node -p "require('$project_root/package.json').version")"
artifact_path="$artifact_root/the-last-alibi-v$version.apk"
built_apk="$android_root/app/build/outputs/apk/release/app-release.apk"

if [[ -z "${JAVA_HOME:-}" ]]; then
  java_binary="$(readlink -f "$(command -v java)")"
  export JAVA_HOME="$(dirname "$(dirname "$java_binary")")"
fi

if [[ -z "${ANDROID_HOME:-}" ]]; then
  export ANDROID_HOME="$project_root/.android-toolchain/sdk"
fi
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export GRADLE_USER_HOME="${GRADLE_USER_HOME:-$project_root/.gradle-local}"
export NODE_ENV=production

if [[ -z "${SENTRY_ORG:-}" || -z "${SENTRY_PROJECT:-}" || -z "${SENTRY_AUTH_TOKEN:-}" ]]; then
  export SENTRY_DISABLE_AUTO_UPLOAD=true
fi

if [[ ! -d "$android_root" ]]; then
  (cd "$project_root" && npx expo prebuild --platform android --no-install)
fi

(cd "$android_root" && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a --no-daemon --no-build-cache --no-parallel --max-workers=1)

if [[ ! -f "$built_apk" ]]; then
  echo "Gradle completed without producing $built_apk" >&2
  exit 1
fi

mkdir -p "$artifact_root"
cp "$built_apk" "$artifact_path"
echo "APK: $artifact_path"
echo "Size: $(stat -c %s "$artifact_path") bytes"
sha256sum "$artifact_path"
