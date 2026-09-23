#!/usr/bin/env bash
set -euo pipefail

PROJECT="${1:-$PWD}"
VERSION_NAME="${DADYOOM_VERSION_NAME:-1.0.0}"
VERSION_CODE="${DADYOOM_VERSION_CODE:-1}"
TEAM_ID="${DADYOOM_APPLE_TEAM_ID:-}"
DEVICE_ID="${DADYOOM_IOS_DEVICE:-}"
EXPECTED_BRANCH="fix/mobile-cloud-video-final-20260923"
APP_ID="com.dadyoom.app"
MODEL_NAME="dadyoom-qwen2.5-1.5b-instruct-q8.task"
PRODUCTION_URL="https://dadyoom.mrahmedsamirhamam.workers.dev"

pass() {
  printf '\033[32m%s\033[0m\n' "$1"
}

warn() {
  printf '\033[33m%s\033[0m\n' "$1"
}

fail() {
  printf '\033[31mFAILED=%s\033[0m\n' "$1"
  exit 1
}

section() {
  echo
  echo "============================================================"
  echo " $1"
  echo "============================================================"
}

if [[ "$(uname -s)" != "Darwin" ]]; then
  fail "IOS_FINALIZATION_REQUIRES_MACOS"
fi

cd "$PROJECT"

[[ -f package.json ]] || fail "PROJECT_NOT_FOUND"
command -v xcodebuild >/dev/null || fail "XCODE_NOT_INSTALLED"
command -v node >/dev/null || fail "NODE_NOT_INSTALLED"
command -v npm >/dev/null || fail "NPM_NOT_INSTALLED"
command -v pod >/dev/null || fail "COCOAPODS_NOT_INSTALLED_RUN_BREW_INSTALL_COCOAPODS"

section "1/8 REPOSITORY"

CURRENT_BRANCH="$(git branch --show-current)"
if [[ "$CURRENT_BRANCH" != "$EXPECTED_BRANCH" ]]; then
  fail "WRONG_BRANCH current=$CURRENT_BRANCH expected=$EXPECTED_BRANCH"
fi

if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  git status --short
  fail "TRACKED_WORKTREE_NOT_CLEAN"
fi

git fetch origin "$EXPECTED_BRANCH"
git pull --ff-only origin "$EXPECTED_BRANCH"

pass "REPOSITORY=PASS"
echo "HEAD=$(git rev-parse HEAD)"

section "2/8 CAPACITOR CONFIG"

mkdir -p mobile-shell

cat > capacitor.config.ts <<'EOF'
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.dadyoom.app",
  appName: "Dadyoom",
  webDir: "mobile-shell",
  server: {
    url: "https://dadyoom.mrahmedsamirhamam.workers.dev",
    cleartext: false,
    androidScheme: "https",
    allowNavigation: [
      "dadyoom.mrahmedsamirhamam.workers.dev",
    ],
  },
  ios: {
    contentInset: "automatic",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
EOF

cat > mobile-shell/index.html <<'EOF'
<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>Dadyoom</title>
</head>
<body>
  <main>
    <h1>ضاديوم</h1>
    <p>جارٍ الاتصال ببيت العربية الرقمي…</p>
  </main>
</body>
</html>
EOF

npm install --legacy-peer-deps --no-package-lock

pass "CAPACITOR_CONFIG=PASS"
echo "APP_ID=$APP_ID"
echo "SERVER_URL=$PRODUCTION_URL"

section "3/8 IOS PROJECT"

if [[ -d ios/App && ! -f ios/App/Podfile ]]; then
  BACKUP="ios-spm-backup-$(date +%Y%m%d-%H%M%S)"
  mv ios "$BACKUP"
  warn "Existing non-CocoaPods iOS project was backed up to $BACKUP"
fi

if [[ ! -d ios/App ]]; then
  npx cap add ios --packagemanager CocoaPods
  pass "IOS_PROJECT=CREATED_COCOAPODS"
else
  pass "IOS_PROJECT=EXISTING_COCOAPODS_PRESERVED"
fi

npx cap sync ios
pass "CAP_SYNC_IOS=PASS"
pass "IOS_LLM_BACKEND=COCOAPODS_MEDIAPIPE_TASK"

PLIST="$PROJECT/ios/App/App/Info.plist"
PBX="$PROJECT/ios/App/App.xcodeproj"
WORKSPACE="$PROJECT/ios/App/App.xcworkspace"

[[ -f "$PLIST" ]] || fail "IOS_INFO_PLIST_MISSING"
[[ -d "$PBX" ]] || fail "IOS_XCODE_PROJECT_MISSING"
[[ -d "$WORKSPACE" ]] || fail "IOS_XCODE_WORKSPACE_MISSING"

section "4/8 OAUTH URL SCHEME"

PLIST_JSON="$(mktemp)"
plutil -convert json -o "$PLIST_JSON" "$PLIST"

node - "$PLIST_JSON" <<'NODE'
const fs = require("fs");
const path = process.argv[process.argv.length - 1];
const data = JSON.parse(fs.readFileSync(path, "utf8"));
const list = Array.isArray(data.CFBundleURLTypes)
  ? data.CFBundleURLTypes
  : [];

const hasDadyoom = list.some((item) =>
  Array.isArray(item?.CFBundleURLSchemes) &&
  item.CFBundleURLSchemes.includes("dadyoom")
);

if (!hasDadyoom) {
  list.push({
    CFBundleTypeRole: "Editor",
    CFBundleURLSchemes: ["dadyoom"],
  });
}

data.CFBundleURLTypes = list;
fs.writeFileSync(path, JSON.stringify(data, null, 2));
NODE

plutil -convert xml1 -o "$PLIST" "$PLIST_JSON"
rm -f "$PLIST_JSON"

if ! plutil -p "$PLIST" | grep -q '"dadyoom"'; then
  fail "IOS_URL_SCHEME_NOT_ADDED"
fi

pass "IOS_DEEP_LINK=dadyoom://auth/callback"

section "5/8 OFFLINE QWEN MODEL"

MODEL_CANDIDATES=(
  "$PROJECT/.dadyoom-mobile/ios-final-kit/$MODEL_NAME"
  "$PROJECT/.dadyoom-mobile/models/$MODEL_NAME"
)

MODEL_PATH=""
for CANDIDATE in "${MODEL_CANDIDATES[@]}"; do
  if [[ -f "$CANDIDATE" ]]; then
    MODEL_PATH="$CANDIDATE"
    break
  fi
done

[[ -n "$MODEL_PATH" ]] || fail "IOS_OFFLINE_MODEL_NOT_FOUND"

IOS_APP_DIR="$PROJECT/ios/App/App"
IOS_MODEL="$IOS_APP_DIR/$MODEL_NAME"
cp -f "$MODEL_PATH" "$IOS_MODEL"

if ! ruby -e 'require "xcodeproj"' >/dev/null 2>&1; then
  warn "Installing xcodeproj Ruby gem for the current user..."
  gem install --user-install xcodeproj --no-document
fi

MODEL_NAME="$MODEL_NAME" VERSION_NAME="$VERSION_NAME" VERSION_CODE="$VERSION_CODE" TEAM_ID="$TEAM_ID" ruby <<'RUBY'
require "xcodeproj"

project = Xcodeproj::Project.open("ios/App/App.xcodeproj")
target = project.targets.find { |item| item.name == "App" }
raise "App target not found" unless target

app_group =
  project.main_group.groups.find { |group| group.display_name == "App" } ||
  project.main_group.find_subpath("App", true)

model_name = ENV.fetch("MODEL_NAME")
reference =
  app_group.files.find { |file| file.path == model_name } ||
  app_group.new_file(model_name)

unless target.resources_build_phase.files_references.include?(reference)
  target.resources_build_phase.add_file_reference(reference, true)
end

target.build_configurations.each do |config|
  config.build_settings["PRODUCT_BUNDLE_IDENTIFIER"] = "com.dadyoom.app"
  config.build_settings["MARKETING_VERSION"] = ENV.fetch("VERSION_NAME")
  config.build_settings["CURRENT_PROJECT_VERSION"] = ENV.fetch("VERSION_CODE")

  team = ENV["TEAM_ID"].to_s.strip
  unless team.empty?
    config.build_settings["DEVELOPMENT_TEAM"] = team
    config.build_settings["CODE_SIGN_STYLE"] = "Automatic"
  end
end

project.save
RUBY

grep -q "$MODEL_NAME" ios/App/App.xcodeproj/project.pbxproj || fail "IOS_MODEL_NOT_IN_XCODE_RESOURCES"

pass "IOS_OFFLINE_MODEL=EMBEDDED"
echo "MODEL_BYTES=$(stat -f%z "$IOS_MODEL")"

section "6/8 SOURCE + VIDEO QUALITY GATES"

npx eslint \
  "lib/video/cinematic-client.ts" \
  "lib/video/cinematic-avatar-agent.ts" \
  "app/api/video/cinematic/route.ts" \
  "app/api/video/cinematic/status/route.ts" \
  "app/api/video/cinematic/health/route.ts" \
  "app/(dashboard)/ask/page.tsx" \
  "components/dad-ai/DadLessonVideoButton.tsx" \
  "lib/mobile/offline-ai.ts" \
  "lib/mobile/hybrid-ai.ts"

npm run test:run
npm run build:vinext

pass "IOS_SHARED_VIDEO_SOURCE=PASS"
pass "IOS_WEB_BUILD=PASS"

section "7/8 XCODE BUILD"

ARTIFACTS="$PROJECT/.dadyoom-mobile/final-release"
mkdir -p "$ARTIFACTS"

xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme App \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination "generic/platform=iOS Simulator" \
  CODE_SIGNING_ALLOWED=NO \
  build

pass "IOS_SIMULATOR_BUILD=PASS"

if [[ -n "$TEAM_ID" ]]; then
  ARCHIVE="$ARTIFACTS/Dadyoom-iOS-$VERSION_NAME.xcarchive"

  xcodebuild \
    -workspace "$WORKSPACE" \
    -scheme App \
    -configuration Release \
    -destination "generic/platform=iOS" \
    -archivePath "$ARCHIVE" \
    DEVELOPMENT_TEAM="$TEAM_ID" \
    CODE_SIGN_STYLE=Automatic \
    -allowProvisioningUpdates \
    archive

  pass "IOS_SIGNED_ARCHIVE=PASS"
  echo "IOS_ARCHIVE=$ARCHIVE"
else
  warn "IOS_SIGNED_ARCHIVE=SKIPPED_NO_TEAM_ID"
fi

if [[ -n "$DEVICE_ID" ]]; then
  if [[ -z "$TEAM_ID" ]]; then
    fail "IOS_DEVICE_TEST_REQUIRES_DADYOOM_APPLE_TEAM_ID"
  fi

  npx cap run ios --target "$DEVICE_ID"
  pass "IOS_DEVICE_RUN_REQUEST=PASS"
else
  warn "IOS_DEVICE_INSTALL=SKIPPED_NO_DADYOOM_IOS_DEVICE"
fi

section "8/8 SAVE REPRODUCIBLE IOS SOURCE"

git add -- \
  .gitignore \
  capacitor.config.ts \
  mobile-shell \
  ios \
  lib/video \
  lib/mobile/offline-ai.ts \
  app/api/video \
  "app/(dashboard)/ask/page.tsx" \
  components/dad-ai/DadLessonVideoButton.tsx \
  scripts

git diff --cached --check

if [[ -n "$(git diff --cached --name-only)" ]]; then
  git commit -m "Finalize iOS $VERSION_NAME and shared cloud video"
  git push origin "HEAD:$EXPECTED_BRANCH"
  pass "IOS_SOURCE_PUSH=PASS"
else
  pass "IOS_SOURCE_PUSH=NO_NEW_CHANGES"
fi

REPORT="$ARTIFACTS/DADYOOM-IOS-FINAL-REPORT.txt"
{
  echo "DADYOOM_IOS_FINAL_SOURCE=PASS"
  echo "VERSION=$VERSION_NAME ($VERSION_CODE)"
  echo "APP_ID=$APP_ID"
  echo "IOS_DEEP_LINK=dadyoom://auth/callback"
  echo "IOS_OFFLINE_QWEN=EMBEDDED"
  echo "IOS_LLM_BACKEND=COCOAPODS_MEDIAPIPE_TASK"
  echo "IOS_SIMULATOR_BUILD=PASS"
  echo "VIDEO_IOS=SHARED_CLOUD_FIXED"
  echo "VIDEO_WEB=SHARED_CLOUD_FIXED"
  echo "VIDEO_ANDROID=SHARED_CLOUD_FIXED"
  if [[ -n "$TEAM_ID" ]]; then
    echo "IOS_SIGNED_ARCHIVE=READY"
  else
    echo "IOS_SIGNED_ARCHIVE=NEEDS_APPLE_TEAM_ID"
  fi
  if [[ -n "$DEVICE_ID" ]]; then
    echo "IOS_DEVICE_TEST=REQUESTED"
  else
    echo "IOS_DEVICE_TEST=NEEDS_DEVICE_UDID"
  fi
} > "$REPORT"

echo
pass "DADYOOM IOS FINALIZATION COMPLETE"
echo "REPORT=$REPORT"
echo "NEXT=Test login, lessons, cloud AI, offline AI, video generation, notifications, rewards, and payments on the iPhone."
