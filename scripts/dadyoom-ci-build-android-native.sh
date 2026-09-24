#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$PWD}"
cd "$ROOT"

OUT="$ROOT/.dadyoom-mobile/ci/android"
VERSION_NAME="${DADYOOM_ANDROID_VERSION_NAME:-1.0.0}"
VERSION_CODE="${DADYOOM_ANDROID_VERSION_CODE:-1}"
MODEL_NAME="dadyoom-qwen2.5-1.5b-instruct-q8.task"
DEFAULT_MODEL_URL="https://huggingface.co/litert-community/Qwen2.5-1.5B-Instruct/resolve/main/Qwen2.5-1.5B-Instruct_multi-prefill-seq_q8_ekv1280.task?download=true"
MODEL_URL="${DADYOOM_ANDROID_MODEL_URL:-$DEFAULT_MODEL_URL}"
MODEL_EXPECTED_BYTES=1625493432

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
updated, count = re.subn(r"minSdkVersion\s*=\s*\d+", "minSdkVersion = 26", text, count=1)
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

APP_GRADLE="$ROOT/android/app/build.gradle"
python3 - "$APP_GRADLE" "$VERSION_NAME" "$VERSION_CODE" <<'PY'
from pathlib import Path
import re
import sys
p = Path(sys.argv[1])
version_name = sys.argv[2]
version_code = sys.argv[3]
text = p.read_text()
text, c1 = re.subn(r"versionCode\s+\d+", f"versionCode {version_code}", text, count=1)
text, c2 = re.subn(r'versionName\s+"[^"]+"', f'versionName "{version_name}"', text, count=1)
if c1 != 1 or c2 != 1:
    raise SystemExit("FAILED=ANDROID_VERSION_PATCH_NOT_APPLIED")
p.write_text(text)
PY

echo "ANDROID_VERSION=$VERSION_NAME ($VERSION_CODE)"

MODEL_PATH="$ROOT/android/app/src/main/assets/$MODEL_NAME"
mkdir -p "$(dirname "$MODEL_PATH")"
echo "Downloading official offline Qwen model..."
curl --fail --location --retry 3 --retry-delay 5 "$MODEL_URL" -o "$MODEL_PATH"

MODEL_BYTES="$(stat -c%s "$MODEL_PATH")"
echo "ANDROID_MODEL_BYTES=$MODEL_BYTES"
if [[ "$MODEL_BYTES" -lt 1500000000 ]]; then
  echo "FAILED=ANDROID_OFFLINE_MODEL_DOWNLOAD_TOO_SMALL bytes=$MODEL_BYTES expected=$MODEL_EXPECTED_BYTES"
  exit 1
fi
echo "ANDROID_OFFLINE_MODEL=EMBEDDED"

cd android
./gradlew --no-daemon assembleDebug
cd "$ROOT"

APK="$ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
[[ -f "$APK" ]] || {
  echo "FAILED=ANDROID_DEBUG_APK_NOT_FOUND"
  exit 1
}

cp "$APK" "$OUT/Dadyoom-Android-native-offline-test.apk"
echo "ANDROID_NATIVE_OFFLINE_TEST_APK=READY"

SIGNED_RELEASE="$OUT/Dadyoom-Android-release.apk"
if [[ -n "${DADYOOM_ANDROID_KEYSTORE_B64:-}" && -n "${DADYOOM_ANDROID_STORE_PASSWORD:-}" && -n "${DADYOOM_ANDROID_KEY_PASSWORD:-}" ]]; then
  KEY_ALIAS="${DADYOOM_ANDROID_KEY_ALIAS:-dadyoom-upload}"
  KEYSTORE="$ROOT/.dadyoom-work/dadyoom-upload-key-ci.jks"
  mkdir -p "$(dirname "$KEYSTORE")"
  printf '%s' "$DADYOOM_ANDROID_KEYSTORE_B64" | base64 --decode > "$KEYSTORE"

  cd android
  ./gradlew --no-daemon assembleRelease \
    "-Pandroid.injected.signing.store.file=$KEYSTORE" \
    "-Pandroid.injected.signing.store.password=$DADYOOM_ANDROID_STORE_PASSWORD" \
    "-Pandroid.injected.signing.key.alias=$KEY_ALIAS" \
    "-Pandroid.injected.signing.key.password=$DADYOOM_ANDROID_KEY_PASSWORD"
  cd "$ROOT"

  RELEASE_APK="$ROOT/android/app/build/outputs/apk/release/app-release.apk"
  [[ -f "$RELEASE_APK" ]] || {
    echo "FAILED=ANDROID_SIGNED_RELEASE_APK_NOT_FOUND"
    exit 1
  }

  cp "$RELEASE_APK" "$SIGNED_RELEASE"
  cp "$RELEASE_APK" "$OUT/Dadyoom-Android-$VERSION_NAME-release.apk"

  APKSIGNER="$(find "${ANDROID_HOME:-/usr/local/lib/android/sdk}/build-tools" -type f -name apksigner 2>/dev/null | sort -V | tail -n 1 || true)"
  if [[ -n "$APKSIGNER" ]]; then
    "$APKSIGNER" verify --verbose "$SIGNED_RELEASE"
    echo "ANDROID_RELEASE_SIGNATURE_VERIFY=PASS"
  fi

  rm -f "$KEYSTORE"
  echo "ANDROID_RELEASE_SIGNED=PASS"
else
  echo "ANDROID_RELEASE_SIGNED=SKIPPED_SIGNING_SECRETS_MISSING"
fi

cat > "$OUT/README.txt" <<EOF
DADYOOM ANDROID NATIVE ARTIFACTS

Dadyoom-Android-native-offline-test.apk
- Native Capacitor Android APK.
- Includes the official offline Qwen2.5 1.5B q8 MediaPipe/LiteRT model.
- Debug-signed for device testing only.

Dadyoom-Android-release.apk
- Created only when permanent signing secrets are configured.
- This is the file intended for direct public download and stable updates.

Version: $VERSION_NAME ($VERSION_CODE)
Offline model bytes: $MODEL_BYTES
EOF

echo "ANDROID_NATIVE_APK=READY"
echo "ANDROID_NATIVE_BUILD=PASS"
echo "OUTPUT=$OUT"
