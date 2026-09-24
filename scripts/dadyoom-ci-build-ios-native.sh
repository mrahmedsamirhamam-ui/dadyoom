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

# CocoaPods must compile only the legacy MediaPipe-compatible plugin sources.
# ios/Sources/LiteRTLM belongs to the SwiftPM target and imports CLiteRTLM,
# which is intentionally unavailable in the CocoaPods integration.
text, source_count = re.subn(
    r"s\.source_files\s*=\s*['\"]ios/Sources/\*\*/\*\.\{swift,h,m,c,cc,mm,cpp\}['\"]",
    "s.source_files = 'ios/Sources/LLMPlugin/**/*.{swift,h,m,c,cc,mm,cpp}'",
    text,
    count=1,
)
if source_count != 1:
    raise SystemExit("FAILED=IOS_LLM_POD_SOURCE_FILTER_NOT_APPLIED")

# The 8.1.4 CocoaPods source still contains Task closures that Xcode 26.6
# diagnoses as Swift 6 sending/data-race errors. Compile this legacy
# MediaPipe CocoaPods path in Swift 5 language mode; the compiler/toolchain
# remains Xcode 26.6 and the native APIs are unchanged.
text, swift_count = re.subn(
    r"s\.swift_version\s*=\s*['\"]6\.0['\"]",
    "s.swift_version = '5.0'",
    text,
    count=1,
)
if swift_count != 1:
    raise SystemExit("FAILED=IOS_LLM_SWIFT_LANGUAGE_MODE_PATCH_NOT_APPLIED")

if "s.static_framework = true" not in text:
    marker = re.search(r"^\s*s\.swift_version\s*=.*$", text, flags=re.MULTILINE)
    if marker:
        insert_at = marker.end()
        text = text[:insert_at] + "\n  s.static_framework = true" + text[insert_at:]
    else:
        text = re.sub(r"\nend\s*$", "\n  s.static_framework = true\nend\n", text, count=1)

p.write_text(text)
PY

grep -q "s.source_files = 'ios/Sources/LLMPlugin/\*\*/\*.{swift,h,m,c,cc,mm,cpp}'" "$LLM_PODSPEC" || {
  echo "FAILED=IOS_LLM_POD_SOURCE_FILTER_NOT_SET"
  exit 1
}
echo "IOS_LLM_POD_SOURCE_FILTER=LLMPlugin_ONLY"

grep -q "s.swift_version = '5.0'" "$LLM_PODSPEC" || {
  echo "FAILED=IOS_LLM_SWIFT_LANGUAGE_MODE_NOT_SET"
  exit 1
}
echo "IOS_LLM_SWIFT_LANGUAGE_MODE=5"

grep -q 's.static_framework = true' "$LLM_PODSPEC" || {
  echo "FAILED=IOS_LLM_POD_STATIC_FRAMEWORK_NOT_SET"
  exit 1
}
echo "IOS_LLM_POD_STATIC_FRAMEWORK=PASS"

# Xcode 26 / Swift 6 imports URLSessionDownloadDelegate as Sendable.
# The plugin delegate keeps a weak CAPPlugin reference, so declare the delegate
# final and explicitly use unchecked Sendable for this bridging object.
LLM_SWIFT="$ROOT/node_modules/@capgo/capacitor-llm/ios/Sources/LLMPlugin/LLMPlugin.swift"
[[ -f "$LLM_SWIFT" ]] || {
  echo "FAILED=IOS_LLM_SWIFT_SOURCE_MISSING"
  exit 1
}

python3 - "$LLM_SWIFT" <<'PY'
from pathlib import Path
import sys

p = Path(sys.argv[1])
text = p.read_text()
old = "class DownloadDelegate: NSObject, URLSessionDownloadDelegate {"
new = "final class DownloadDelegate: NSObject, URLSessionDownloadDelegate, @unchecked Sendable {"

if new not in text:
    if old not in text:
        raise SystemExit("FAILED=IOS_DOWNLOAD_DELEGATE_PATCH_TARGET_MISSING")
    text = text.replace(old, new, 1)

p.write_text(text)
PY

grep -q 'final class DownloadDelegate: NSObject, URLSessionDownloadDelegate, @unchecked Sendable' "$LLM_SWIFT" || {
  echo "FAILED=IOS_DOWNLOAD_DELEGATE_SENDABLE_PATCH_NOT_SET"
  exit 1
}
echo "IOS_DOWNLOAD_DELEGATE_SENDABLE_PATCH=PASS"

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

# Use the official LiteRT / MediaPipe Qwen2.5 1.5B q8 model without
# committing the 1.6 GB binary to Git. An optional secret URL can override the
# public source if a controlled mirror is configured later.
MODEL_NAME="dadyoom-qwen2.5-1.5b-instruct-q8.task"
DEFAULT_MODEL_URL="https://huggingface.co/litert-community/Qwen2.5-1.5B-Instruct/resolve/main/Qwen2.5-1.5B-Instruct_multi-prefill-seq_q8_ekv1280.task?download=true"
MODEL_URL="${DADYOOM_IOS_MODEL_URL:-$DEFAULT_MODEL_URL}"
MODEL_EXPECTED_BYTES=1625493432

# Keep the simulator artifact small. The physical-device build receives the
# offline model after the simulator build has completed.
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

echo "Downloading official offline Qwen model for the iPhone device build..."
curl --fail --location --retry 3 --retry-delay 5 "$MODEL_URL" -o "ios/App/App/$MODEL_NAME"

MODEL_BYTES="$(stat -f%z "ios/App/App/$MODEL_NAME")"
echo "IOS_MODEL_BYTES=$MODEL_BYTES"
if [[ "$MODEL_BYTES" -lt 1500000000 ]]; then
  echo "FAILED=IOS_OFFLINE_MODEL_DOWNLOAD_TOO_SMALL bytes=$MODEL_BYTES expected=$MODEL_EXPECTED_BYTES"
  exit 1
fi

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

echo "IOS_OFFLINE_MODEL=EMBEDDED_DEVICE_BUILD"

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
- Includes the official offline Qwen2.5 1.5B q8 MediaPipe/LiteRT model.
- It is intentionally unsigned.
- It cannot be installed directly on an iPhone until Apple signing/provisioning
  is applied.

The build is a real Capacitor iOS application using com.dadyoom.app.
EOF

echo "IOS_DEVICE_UNSIGNED_IPA=READY"
echo "IOS_APP_ID=$APP_ID"
echo "IOS_NATIVE_BUILD=PASS"
echo "OUTPUT=$OUT"
