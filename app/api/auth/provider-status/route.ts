import {
  SUPABASE_PUBLIC_KEY,
  SUPABASE_PUBLIC_URL,
} from "@/lib/supabase/public-config";


export async function GET() {
  const url = SUPABASE_PUBLIC_URL;
  const key = SUPABASE_PUBLIC_KEY;

  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/settings`, {
      headers: { apikey: key },
      cache: "no-store",
    });

    if (!response.ok) {
      return Response.json({ google: null, configured: false }, { status: 200 });
    }

    const settings = (await response.json()) as {
      external?: Record<string, boolean>;
    };

    return Response.json({
      google: typeof settings.external?.google === "boolean" ? settings.external.google : null,
      configured: typeof settings.external?.google === "boolean",
    });
  } catch {
    return Response.json({ google: null, configured: false }, { status: 200 });
  }
}
