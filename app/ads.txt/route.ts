export async function GET() {
  const client =
    process.env.ADSENSE_CLIENT?.trim() ||
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() ||
    "";

  const publisher = /^ca-pub-\d{16}$/u.test(client)
    ? client.slice("ca-".length)
    : "";

  const body = publisher
    ? `google.com, ${publisher}, DIRECT, f08c47fec0942fa0\n`
    : "# AdSense publisher ID is not configured yet.\n";

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
