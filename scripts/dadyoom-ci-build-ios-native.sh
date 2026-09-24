#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$PWD}"
cd "$ROOT"

APP_ID="com.dadyoom.app"
OUT="$ROOT/.dadyoom-mobile/ci/ios"
DERIVED="$ROOT/.dadyoom-work/ios-ci-derived"

echo "============================================================"
echo " DADYOOM IOS NATIVE CI BUILD"
echo "============================================================"

[[ "$(uname -s)" == "Darwin" ]] || {
  echo "FAILED=MACOS_REQUIRED"
  exit 1
}

command -v node >/dev/null || {
  echo "FAILED=NODE_MISSING"
  exit 1
}

command -v npm >/dev/null || {
  echo "FAILED=NPM_MISSING"
  exit 1
}

command -v xcodebuild >/dev/null || {
  echo "FAILED=XCODE_MISSING"
  exit 1
}

if ! command -v pod >/dev/null; then
  echo "Installing CocoaPods..."
  sudo gem install cocoapods --no-document
fi

rm -rf "$OUT" "$DERIVED"
mkdir -p "$OUT" "$DERIVED"

npm install --legacy-peer-deps --no-package-lock

# @capgo/capacitor-llm depends on MediaPipe GenAI prebuilt static
# XCFrameworks in its CocoaPods integration. Mark the plugin pod itself as a
# static framework so CocoaPods does not validate it as a dynamic framework
# with transitive static binaries.
LLM_PODSPEC="$ROOT/node_modules/@capgo/capacitor-llm/CapgoCapacitorLlm.podspec"
[[ -f "$LLM_PODSPEC" ]] || {
  echo "FAILED=IOS_LLM_PODSPEC_MISSING"
  exit 1
}

python3 - "$LLM_PODSPEC" <<'PY'
from pathlib import Path
import re
import sys

p = Path(sys.argv[1])
text = p.read_text()

if "s.static_framework = true" not in text:
    marker = re.search(r"^\s*s\.swift_version\s*=.*$", text, flags=re.MULTILINE)
    if marker:
        insert_at = marker.end()
        text = text[:insert_at] + "\n  s.static_framework = true" + text[insert_at:]
    else:
        text = re.sub(r"\nend\s*$", "\n  s.static_framework = true\nend\n", text, count=1)

p.write_text(text)
PY

grep -q 's.static_framework = true' "$LLM_PODSPEC" || {
  echo "FAILED=IOS_LLM_POD_STATIC_FRAMEWORK_NOT_SET"
  exit 1
}
echo "IOS_LLM_POD_STATIC_FRAMEWORK=PASS"

# CI starts from a clean checkout. Recreate the native iOS project so the
# repository remains lightweight while the produced artifact is fully native.
rm -rf ios
npx cap add ios --packagemanager CocoaPods

PODFILE="$ROOT/ios/App/Podfile"
PBXPROJ="$ROOT/ios/App/App.xcodeproj/project.pbxproj"

[[ -f "$PODFILE" ]] || {
  echo "FAILED=IOS_PODFILE_MISSING_AFTER_CAP_ADD"
  exit 1
}

# MediaPipeTasksGenAI ships static XCFrameworks. Capacitor's default dynamic
# use_frameworks! causes CocoaPods to reject the transitive static binaries.
python3 - "$PODFILE" <<'PY'
from pathlib import Path
import re
import sys

p = Path(sys.argv[1])
text = p.read_text()

text = re.sub(
    r"platform :ios, ['\"]\d+(?:\.\d+)?['\"]",
    "platform :ios, '16.0'",
    text,
    count=1,
)

text = re.sub(
    r"^use_frameworks!\s*$",
    "use_frameworks! :linkage => :static",
    text,
    count=1,
    flags=re.MULTILINE,
)

p.write_text(text)
PY

if ! grep -q "use_frameworks! :linkage => :static" "$PODFILE"; then
  echo "FAILED=IOS_STATIC_LINKAGE_NOT_SET"
  exit 1
fi

# Match the Xcode target deployment version to MediaPipe's iOS requirement.
if [[ -f "$PBXPROJ" ]]; then
  sed -i '' -E \
    's/IPHONEOS_DEPLOYMENT_TARGET = [0-9.]+;/IPHONEOS_DEPLOYMENT_TARGET = 16.0;/g' \
    "$PBXPROJ"
fi

echo "IOS_PODFILE_STATIC_LINKAGE=PASS"
echo "IOS_DEPLOYMENT_TARGET=16.0"

npx cap sync ios

PLIST="$ROOT/ios/App/App/Info.plist"
PROJECT="$ROOT/ios/App/App.xcodeproj"
WORKSPACE="$ROOT/ios/App/App.xcworkspace"

[[ -f "$PLIST" ]] || {
  echo "FAILED=IOS_INFO_PLIST_MISSING"
  exit 1
}

[[ -d "$PROJECT" ]] || {
  echo "FAILED=IOS_XCODE_PROJECT_MISSING"
  exit 1
}

[[ -d "$WORKSPACE" ]] || {
  echo "FAILED=IOS_XCODE_WORKSPACE_MISSING"
  exit 1
}

# Native OAuth callback.
PLIST_JSON="$(mktemp)"
plutil -convert json -o "$PLIST_JSON" "$PLIST"

node - "$PLIST_JSON" <<'NODE'
const fs = require("fs");
const file = process.argv[process.argv.length - 1];
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const urlTypes = Array.isArray(data.CFBundleURLTypes)
  ? data.CFBundleURLTypes
  : [];

const present = urlTypes.some(
  (item) =>
    Array.isArray(item?.CFBundleURLSchemes) &&
    item.CFBundleURLSchemes.includes("dadyoom"),
);

if (!present) {
  urlTypes.push({
    CFBundleTypeRole: "Editor",
    CFBundleURLSchemes: ["dadyoom"],
  });
}

data.CFBundleURLTypes = urlTypes;
fs.writeFileSync(file, JSON.stringify(data, null, 2));
NODE

plutil -convert xml1 -o "$PLIST" "$PLIST_JSON"
rm -f "$PLIST_JSON"

# Optional offline model. CI can build without it; if a private/public URL is
# provided later, the exact same workflow embeds it into the native app.
MODEL_NAME="dadyoom-qwen2.5-1.5b-instruct-q8.task"
MODEL_URL="${DADYOOM_IOS_MODEL_URL:-}"

if [[ -n "$MODEL_URL" ]]; then
  echo "Downloading optional offline AI model..."
  curl --fail --location --retry 3 "$MODEL_URL" -o "ios/App/App/$MODEL_NAME"

  MODEL_NAME="$MODEL_NAME" ruby <<'RUBY'
require "xcodeproj"

project = Xcodeproj::Project.open("ios/App/App.xcodeproj")
target = project.targets.find { |item| item.name == "App" }
raise "App target not found" unless target

group =
  project.main_group.groups.find { |item| item.display_name == "App" } ||
  project.main_group.find_subpath("App", true)

name = ENV.fetch("MODEL_NAME")
ref = group.files.find { |file| file.path == name } || group.new_file(name)

unless target.resources_build_phase.files_references.include?(ref)
  target.resources_build_phase.add_file_reference(ref, true)
end

project.save
RUBY

  echo "IOS_OFFLINE_MODEL=EMBEDDED"
else
  echo "IOS_OFFLINE_MODEL=NOT_EMBEDDED_CLOUD_FIRST_BUILD"
fi

echo "Building iOS Simulator..."
xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme App \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination "generic/platform=iOS Simulator" \
  -derivedDataPath "$DERIVED/simulator" \
  CODE_SIGNING_ALLOWED=NO \
  build

SIM_APP="$(find "$DERIVED/simulator/Build/Products" -maxdepth 3 -type d -name "App.app" | head -n 1)"
[[ -d "$SIM_APP" ]] || {
  echo "FAILED=IOS_SIMULATOR_APP_NOT_FOUND"
  exit 1
}

ditto -c -k --sequesterRsrc --keepParent "$SIM_APP" "$OUT/Dadyoom-iOS-Simulator.zip"
echo "IOS_SIMULATOR_BUILD=PASS"

echo "Building unsigned iPhone device binary..."
xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme App \
  -configuration Release \
  -sdk iphoneos \
  -destination "generic/platform=iOS" \
  -derivedDataPath "$DERIVED/device" \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  build

DEVICE_APP="$(find "$DERIVED/device/Build/Products" -maxdepth 3 -type d -name "App.app" | head -n 1)"
[[ -d "$DEVICE_APP" ]] || {
  echo "FAILED=IOS_DEVICE_APP_NOT_FOUND"
  exit 1
}

PAYLOAD_DIR="$(mktemp -d)"
mkdir -p "$PAYLOAD_DIR/Payload"
cp -R "$DEVICE_APP" "$PAYLOAD_DIR/Payload/Dadyoom.app"
(
  cd "$PAYLOAD_DIR"
  zip -qry "$OUT/Dadyoom-iOS-unsigned-requires-signing.ipa" Payload
)
rm -rf "$PAYLOAD_DIR"

cat > "$OUT/README.txt" <<'EOF'
DADYOOM IOS NATIVE ARTIFACTS

Dadyoom-iOS-Simulator.zip
- Native iOS simulator app built by Xcode.
- Does not require Apple signing.

Dadyoom-iOS-unsigned-requires-signing.ipa
- Native arm64 iPhone build.
- It is intentionally unsigned.
- It cannot be installed directly on an iPhone until Apple signing/provisioning
  is applied.

The build is a real Capacitor iOS application using com.dadyoom.app.
EOF

echo "IOS_DEVICE_UNSIGNED_IPA=READY"
echo "IOS_APP_ID=$APP_ID"
echo "IOS_NATIVE_BUILD=PASS"
echo "OUTPUT=$OUT"
