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
      return Response.json({ google: false, configured: false }, { status: 200 });
    }

    const settings = (await response.json()) as {
      external?: Record<string, boolean>;
    };

    return Response.json({
      google: settings.external?.google === true,
      configured: true,
    });
  } catch {
    return Response.json({ google: false, configured: false }, { status: 200 });
  }
}
