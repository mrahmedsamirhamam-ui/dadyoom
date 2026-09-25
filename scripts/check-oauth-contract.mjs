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

requireGate(
  proxy.includes('"/student/:path*"') &&
    proxy.includes('"/teacher/:path*"') &&
    proxy.includes('"/parent/:path*"') &&
    proxy.includes('"/school/:path*"') &&
    proxy.includes('"/admin/:path*"'),
  "OAUTH_PROXY_PROTECTED_ROUTES"
);

requireGate(
  !proxy.includes('"/auth/:path*"') &&
    !proxy.includes('"/auth/callback') &&
    !proxy.includes('"/login/:path*"') &&
    !proxy.includes('"/login"'),
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

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("DADYOOM_OAUTH_CONTRACT=PASS");
