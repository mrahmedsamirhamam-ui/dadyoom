import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relative) {
  return fs.readFileSync(
    path.join(root, relative),
    "utf8"
  );
}

function exists(relative) {
  return fs.existsSync(
    path.join(root, relative)
  );
}

const checks = [];

function check(label, ok) {
  checks.push({
    label,
    ok: Boolean(ok),
  });

  console.log(
    `${ok ? "PASS" : "FAIL"} ${label}`
  );
}

const manifest = read(
  "app/manifest.ts"
);

const layout = read(
  "app/layout.tsx"
);

const prompt = read(
  "components/pwa/DadyoomInstallPrompt.tsx"
);

const sw = read(
  "public/sw.js"
);

const autoUpdate = read(
  "components/pwa/DadyoomAutoUpdate.tsx"
);

const capacitorConfig = read(
  "capacitor.config.ts"
);

const packageJson = read(
  "package.json"
);

const nativeTts = read(
  "lib/mobile/native-tts.ts"
);

const arabicSpeech = read(
  "hooks/use-arabic-speech.ts"
);

const dadVoice = read(
  "services/dad-ai/dad-voice.ts"
);

check(
  "PWA_MANIFEST_STANDALONE",
  manifest.includes(
    'display: "standalone"'
  ) &&
    manifest.includes(
      'start_url: "/"'
    ) &&
    manifest.includes(
      'scope: "/"'
    )
);

check(
  "PWA_ICONS_192_512",
  exists(
    "public/pwa/icon-192.png"
  ) &&
    exists(
      "public/pwa/icon-512.png"
    ) &&
    manifest.includes(
      "/pwa/icon-192.png"
    ) &&
    manifest.includes(
      "/pwa/icon-512.png"
    )
);

check(
  "ANDROID_INSTALL_PROMPT",
  prompt.includes(
    "beforeinstallprompt"
  ) &&
    prompt.includes(
      "تثبيت التطبيق"
    )
);

check(
  "IOS_ADD_TO_HOME_SCREEN",
  prompt.includes(
    "إضافة إلى الشاشة الرئيسية"
  ) &&
    prompt.includes(
      "Safari"
    )
);

check(
  "IOS_WEB_APP_METADATA",
  layout.includes(
    "appleWebApp:"
  ) &&
    layout.includes(
      'viewportFit: "cover"'
    ) &&
    layout.includes(
      'apple:'
    )
);

check(
  "INSTALL_UI_WIRED_IN_ROOT_LAYOUT",
  layout.includes(
    "<DadyoomInstallPrompt />"
  )
);

check(
  "SERVICE_WORKER_WIRED",
  prompt.includes(
    'navigator.serviceWorker.register("/sw.js")'
  ) &&
    sw.includes(
      'const OFFLINE_URL = "/offline.html"'
    ) &&
    exists(
      "public/offline.html"
    )
);

check(
  "AUTO_UPDATE_WIRED",
  layout.includes(
    "<DadyoomAutoUpdate />"
  ) &&
    autoUpdate.includes(
      "/app-version.json"
    ) &&
    exists(
      "public/app-version.json"
    )
);

check(
  "PWA_BACKUP_POSITIONING",
  prompt.includes(
    "تطبيق ضاديوم الأصلي Native"
  ) &&
    prompt.includes(
      "نسخة احتياطية — PWA"
    ) &&
    prompt.includes(
      "Android جاهز للتنزيل المباشر"
    ) &&
    prompt.includes(
      "iPhone الأصلي — قريبًا"
    )
);

check(
  "NATIVE_SERVER_CONNECTED",
  capacitorConfig.includes(
    'url: "https://dadyoom.mrahmedsamirhamam.workers.dev"'
  ) &&
    capacitorConfig.includes(
      '"dadyoom.mrahmedsamirhamam.workers.dev"'
    )
);

check(
  "ANDROID_NATIVE_TTS_WIRED",
  packageJson.includes(
    '"@capacitor-community/text-to-speech": "8.0.2"'
  ) &&
    nativeTts.includes(
      "TextToSpeech.speak"
    ) &&
    arabicSpeech.includes(
      "playNativeSpeech"
    ) &&
    dadVoice.includes(
      "speakNativeArabic"
    )
);

const failed =
  checks.filter(
    (item) => !item.ok
  );

console.log(
  `PWA_MOBILE_CHECKS=${checks.length}`
);
console.log(
  `PWA_MOBILE_FAILED=${failed.length}`
);

if (failed.length) {
  console.error(
    "PWA_MOBILE_VERIFY=FAIL"
  );
  process.exit(1);
}

console.log(
  "ANDROID_PWA_INSTALL=READY"
);
console.log(
  "IOS_PWA_INSTALL=READY"
);
console.log(
  "PWA_MOBILE_VERIFY=PASS"
);
