
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    return Response.json({ google: false, configured: false }, { status: 200 });
  }

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
