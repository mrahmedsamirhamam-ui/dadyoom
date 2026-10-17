import { NextResponse } from "next/server";

// Legacy endpoint only. Dadyoom does not accept card or bank payments here.
// Existing authenticated buyers review orders in Dadyoom Accounts.
// Avoid promising Visa/Mastercard after paid checkouts were deliberately paused.
export async function POST() {
  return NextResponse.json(
    {
      error: "PAID_CHECKOUT_PAUSED",
      message: "الاشتراكات الجديدة متوقفة حاليًا. لا تحوّل أموالًا ولا تدخل بيانات بطاقة. يمكنك مراجعة الطلبات الموجودة في ضاديوم حسابات.",
      accountUrl: "/payments/dadyoom",
      acceptsPayment: false,
    },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  );
}
