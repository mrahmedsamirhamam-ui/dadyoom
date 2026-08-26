
import "dotenv/config";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!url || !key) {
  console.error("GOOGLE_AUTH_CHECK=FAILED_ENV");
  process.exit(1);
}

const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/settings`, {
  headers: { apikey: key },
});

if (!response.ok) {
  console.error(`GOOGLE_AUTH_CHECK=HTTP_${response.status}`);
  process.exit(1);
}

const settings = await response.json();
const enabled = settings?.external?.google === true;
console.log(`GOOGLE_PROVIDER_ENABLED=${enabled ? "YES" : "NO"}`);
process.exit(enabled ? 0 : 2);
