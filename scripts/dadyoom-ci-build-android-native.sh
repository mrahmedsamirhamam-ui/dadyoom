#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$PWD}"
cd "$ROOT"

OUT="$ROOT/.dadyoom-mobile/ci/android"

echo "============================================================"
echo " DADYOOM ANDROID NATIVE CI BUILD"
echo "============================================================"

rm -rf "$OUT"
mkdir -p "$OUT"

npm install --legacy-peer-deps --no-package-lock

rm -rf android
npx cap add android
npx cap sync android

cd android
./gradlew --no-daemon assembleDebug
cd "$ROOT"

APK="$ROOT/android/app/build/outputs/apk/debug/app-debug.apk"

[[ -f "$APK" ]] || {
  echo "FAILED=ANDROID_DEBUG_APK_NOT_FOUND"
  exit 1
}

cp "$APK" "$OUT/Dadyoom-Android-native-test.apk"

cat > "$OUT/README.txt" <<'EOF'
DADYOOM ANDROID NATIVE ARTIFACT

Dadyoom-Android-native-test.apk
- Native Capacitor Android APK.
- Signed with the Android debug key for direct device testing.
- A stable permanent release-signing key must be used before this file replaces
  the public download for long-term updates.
EOF

echo "ANDROID_NATIVE_APK=READY"
echo "ANDROID_NATIVE_BUILD=PASS"
echo "OUTPUT=$OUT"
