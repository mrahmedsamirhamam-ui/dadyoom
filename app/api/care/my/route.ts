import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const noCache = { "Cache-Control": "private, no-store" };

export async function GET() {
  try {
    const client = await createClient();
    const { data: { user }, error } = await client.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ authenticated: false, tickets: [] }, { headers: noCache });
    }

    // Access through a server-only client, scoped strictly to the verified auth user ID.
    // Never include internal admin notes or another sender's private details.
    const { data, error: readError } = await createAdminClient()
      .from("support_tickets")
      .select("id,subject,category,status,created_at,public_reply")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (readError) throw readError;

    return NextResponse.json(
      { authenticated: true, tickets: data ?? [] },
      { headers: noCache },
    );
  } catch {
    return NextResponse.json(
      { error: "تعذر جلب حالة طلباتك الآن." },
      { status: 503, headers: noCache },
    );
  }
}
