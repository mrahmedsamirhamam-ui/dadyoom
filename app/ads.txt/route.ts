export async function GET() {
  const client =
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() ?? "";

  const publisher = client.startsWith("ca-pub-")
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
