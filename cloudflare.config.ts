import { bindings, defineConfig, defineWorker } from "cf/config";

// Reproduced exactly from the successfully compiled no-deploy GitHub runner.
// No Cloudflare API key, account ID, data cache bucket or paid binding.
export default defineConfig({
  worker: defineWorker({
    name: "dadyoom",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-25",
    compatibilityFlags: ["nodejs_compat"],
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
    },
  }),
});
