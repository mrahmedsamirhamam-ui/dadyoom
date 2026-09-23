import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.dadyoom.app",
  appName: "Dadyoom",
  webDir: "mobile-shell",
  server: {
    url:
      "https://dadyoom.mrahmedsamirhamam.workers.dev",
    cleartext: false,
    androidScheme: "https",
    allowNavigation: [
      "dadyoom.mrahmedsamirhamam.workers.dev",
    ],
  },
  ios: {
    contentInset:
      "automatic",
  },
  android: {
    allowMixedContent:
      false,
  },
};

export default config;
