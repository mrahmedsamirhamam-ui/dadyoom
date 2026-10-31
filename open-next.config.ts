import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Preview-only: no R2, KV or paid bindings are provisioned.
// Do not promote this config to the live dadyoom service before
// SSR/auth/server-graded question checks and Workers Free size checks pass.
export default defineCloudflareConfig();
