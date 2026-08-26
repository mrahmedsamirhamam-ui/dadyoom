import { NextResponse } from "next/server";
import { isCountryCode } from "@/lib/countries";

const allowedRoles = new Set(["student", "teacher", "parent", "school"]);

export async function POST(request: Request) {
  let body: { fullName?: string; role?: string; country?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "بيانات التسجيل غير صالحة." }, { status: 400 });
  }

  const fullName = typeof body.fullName === "string" ? body.fullName.trim().slice(0, 120) : "";
  const role = typeof body.role === "string" ? body.role.trim().toLowerCase() : "student";
  const country = typeof body.country === "string" ? body.country.trim().toUpperCase() : "";

  if (!fullName) return NextResponse.json({ error: "اكتب الاسم الكامل قبل المتابعة بجوجل." }, { status: 400 });
  if (!allowedRoles.has(role)) return NextResponse.json({ error: "نوع الحساب غير صالح." }, { status: 400 });
  if (!isCountryCode(country)) return NextResponse.json({ error: "اختر الدولة أولًا." }, { status: 400 });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    "dadyoom_oauth_intent",
    Buffer.from(JSON.stringify({ fullName, role, country }), "utf8").toString("base64url"),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 10 * 60,
    }
  );
  return response;
}
