import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function requireGate(condition, marker) {
  if (!condition) {
    console.error(marker + "=FAIL");
    process.exitCode = 1;
    return;
  }
  console.log(marker + "=PASS");
}

const proxy = read("proxy.ts");
const callback = read("app/auth/callback/route.ts");
const googleButton = read("components/auth/GoogleAuthButton.tsx");
const mobileBridge = read("components/mobile/MobileOAuthBridge.tsx");
const onboarding = read("app/onboarding/page.tsx");

requireGate(
  proxy.includes('"/student/:path*"') &&
    proxy.includes('"/teacher/:path*"') &&
    proxy.includes('"/parent/:path*"') &&
    proxy.includes('"/school/:path*"') &&
    proxy.includes('"/admin/:path*"'),
  "OAUTH_PROXY_PROTECTED_ROUTES"
);

const matcherBlock =
  proxy.match(
    /export const config\s*=\s*\{[\s\S]*?matcher\s*:\s*\[([\s\S]*?)\][\s\S]*?\};/u,
  )?.[1] ?? "";

requireGate(
  Boolean(matcherBlock) &&
    !matcherBlock.includes('"/auth/:path*"') &&
    !matcherBlock.includes('"/auth/callback') &&
    !matcherBlock.includes('"/login/:path*"') &&
    !matcherBlock.includes('"/login"'),
  "OAUTH_CALLBACK_LOGIN_OUTSIDE_PROXY"
);

requireGate(
  proxy.includes(".getClaims()") &&
    !proxy.includes(".getSession()"),
  "OAUTH_SINGLE_PROXY_REFRESH_POINT"
);

requireGate(
  callback.includes("exchangeCodeForSession") &&
    callback.includes("destinationForProfile") &&
    callback.includes('response.cookies.delete(') &&
    callback.includes('"dadyoom_oauth_intent"'),
  "OAUTH_WEB_CALLBACK_SESSION_AND_ROUTING"
);

requireGate(
  googleButton.includes('provider: "google"') &&
    googleButton.includes("/auth/callback") &&
    googleButton.includes("skipBrowserRedirect: isNative"),
  "OAUTH_GOOGLE_START_CONTRACT"
);

requireGate(
  mobileBridge.includes("Capacitor.isNativePlatform()") &&
    mobileBridge.includes("lastHandledUrlRef") &&
    mobileBridge.includes("busyRef") &&
    mobileBridge.includes("exchangeCodeForSession") &&
    mobileBridge.includes("App.getLaunchUrl()"),
  "OAUTH_NATIVE_CALLBACK_DEDUP"
);

// Regression guard: incomplete existing profiles must remain on onboarding.
// Prior behavior bounced an incomplete student or staff user between
// /onboarding and the protected role portal without offering repair.
requireGate(
  onboarding.includes("const hasRequiredProfileFields =") &&
    onboarding.includes("isCountryCode(countryCandidate(existing?.country))") &&
    /existingRole\s*&&\s*!studentLike\s*&&\s*hasRequiredProfileFields/u.test(onboarding) &&
    /existing\?\.onboarding_completed\s*&&\s*advancedGrade\s*&&\s*hasRequiredProfileFields/u.test(onboarding),
  "OAUTH_INCOMPLETE_PROFILE_REDIRECT_LOOP_GUARD"
);

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("DADYOOM_OAUTH_CONTRACT=PASS");
