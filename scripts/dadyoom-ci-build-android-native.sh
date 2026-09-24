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

VARS="$ROOT/android/variables.gradle"
[[ -f "$VARS" ]] || {
  echo "FAILED=ANDROID_VARIABLES_GRADLE_MISSING"
  exit 1
}

python3 - "$VARS" <<'PY'
from pathlib import Path
import re
import sys

p = Path(sys.argv[1])
text = p.read_text()
updated, count = re.subn(
    r"minSdkVersion\s*=\s*\d+",
    "minSdkVersion = 26",
    text,
    count=1,
)
if count != 1:
    raise SystemExit("FAILED=ANDROID_MIN_SDK_PATCH_NOT_APPLIED")
p.write_text(updated)
PY

grep -Eq 'minSdkVersion\s*=\s*26' "$VARS" || {
  echo "FAILED=ANDROID_MIN_SDK_NOT_26"
  exit 1
}
echo "ANDROID_MIN_SDK=26"

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
