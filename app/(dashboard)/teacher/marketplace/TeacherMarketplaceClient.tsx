"use client";

import Link from "next/link";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  addMarketplaceLesson,
  confirmBpayCoursePayment,
  createMarketplaceCourse,
  publishMarketplaceCourse,
  savePayoutProfile,
} from "@/features/marketplace/actions";

type Course = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  delivery_mode: string;
  status: string;
  commission_bps: number;
  starts_at: string | null;
  ends_at: string | null;
  schedule_note: string | null;
  max_students: number | null;
  created_at: string;
};

type Earning = {
  id: string;
  gross_amount: number;
  platform_fee: number;
  net_amount: number;
  currency: string;
  status: string;
  created_at: string;
};

type PendingBpayPayment = {
  id: string;
  course_id: string;
  amount: number;
  currency: string;
  bank_reference: string | null;
  updated_at: string;
};

type Payout = {
  bpay_mobile: string | null;
  bpay_name: string | null;
  paypal_email: string | null;
  iban: string | null;
  account_holder_name: string | null;
  bank_name: string | null;
  swift_bic: string | null;
  country: string | null;
  is_verified: boolean;
};

export default function TeacherMarketplaceClient({
  courses,
  earnings,
  payout,
  pendingBpayPayments,
}: {
  courses: Course[];
  earnings: Earning[];
  payout: Payout | null;
  pendingBpayPayments: PendingBpayPayment[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState("");

  const available = earnings
    .filter((item) => item.status === "available")
    .reduce(
      (sum, item) => sum + Number(item.net_amount),
      0,
    );

  async function runAction(
    fn: (
      formData: FormData,
    ) => Promise<{
      ok: boolean;
      message: string;
    }>,
    formData: FormData,
  ) {
    try {
      const result = await fn(formData);
      setStatus(result.message);

      if (result.ok) {
        router.refresh();
      }
    } catch (actionError) {
      setStatus(
        actionError instanceof Error
          ? actionError.message
          : "تعذر إكمال العملية مؤقتًا. تحقق من الحالة المحفوظة قبل إعادة المحاولة.",
      );
    }
  }

  return (
    <main
      dir="rtl"
      className="dadyoom-arabic-surface min-h-screen px-3 py-5 sm:px-5"
    >
      <div className="mx-auto max-w-[1500px] space-y-5">
        <section className="rounded-[2rem] bg-[#123f39] p-6 text-white">
          <div className="text-sm font-black text-[#f3d187]">
            سوق ضاديوم للمعلمين
          </div>
          <h1 className="mt-2 text-3xl font-black">
            الدورات المدفوعة
          </h1>
          <p className="mt-2 leading-8">
            في BPay يدفع الطالب للمعلم مباشرة. يسجّل ضاديوم 15% كعمولة مستحقة للمنصة، ويبقى 85% صافي المعلم.
          </p>
          <div className="mt-4 rounded-2xl bg-white/10 p-4 font-black">
            صافي المعلم المسجل: {available.toFixed(3)} BHD
          </div>
          <Link
            href="/teacher/marketplace/earnings"
            className="mt-3 inline-flex rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-black text-white"
          >
            تفاصيل الأرباح والتحويلات
          </Link>
        </section>

        {status ? (
          <div role="status" aria-live="polite" className="rounded-2xl bg-[#fff7e4] p-3 font-bold">
            {status}
          </div>
        ) : null}

        {pendingBpayPayments.length ? (
          <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-xl font-black text-[#123f39]">
              دفعات BPay تنتظر تأكيدك
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#665b4d]">
              افتح تطبيق BPay وتأكد من وصول المبلغ والمرجع قبل الضغط على تأكيد. بعد التأكيد تُفتح الدورة للطالب ويُسجَّل 15% كعمولة مستحقة لضاديوم.
            </p>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {pendingBpayPayments.map((payment) => {
                const course = courses.find(
                  (item) => item.id === payment.course_id,
                );

                return (
                  <article
                    key={payment.id}
                    className="rounded-2xl border border-amber-200 bg-white p-4"
                  >
                    <div className="font-black text-[#123f39]">
                      {course?.title ?? "دورة مدفوعة"}
                    </div>
                    <div className="mt-2 text-sm font-bold">
                      {Number(payment.amount).toFixed(3)} {payment.currency}
                    </div>
                    <div className="mt-2 rounded-xl bg-[#fff8e8] p-3 text-sm">
                      مرجع BPay:{" "}
                      <b dir="ltr">{payment.bank_reference ?? "—"}</b>
                    </div>
                    <div className="mt-2 text-xs text-[#746957]">
                      أُرسل: {new Date(payment.updated_at).toLocaleString("ar-BH")}
                    </div>

                    <form
                      className="mt-3"
                      action={async (formData) => {
                        await runAction(
                          confirmBpayCoursePayment,
                          formData,
                        );
                      }}
                    >
                      <input
                        type="hidden"
                        name="paymentOrderId"
                        value={payment.id}
                      />
                      <button className="dadyoom-arabic-button w-full rounded-xl px-4 py-2 font-black text-white">
                        تأكيد وصول المبلغ وفتح الدورة
                      </button>
                    </form>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="grid gap-5 xl:grid-cols-2">
          <form
            className="rounded-[2rem] border bg-white p-5"
            onSubmit={async (event) => {
              event.preventDefault();
              await runAction(
                createMarketplaceCourse,
                new FormData(event.currentTarget),
              );
              event.currentTarget.reset();
            }}
          >
            <h2 className="text-xl font-black text-[#123f39]">
              دورة جديدة
            </h2>

            <div className="mt-4 grid gap-3">
              <input
                required
                name="title"
                placeholder="اسم الدورة"
                className="rounded-2xl border p-3"
              />
              <textarea
                name="description"
                rows={4}
                placeholder="وصف الدورة"
                className="rounded-2xl border p-3"
              />
              <input
                required
                name="price"
                type="number"
                min="0.5"
                step="0.001"
                defaultValue="5.000"
                className="rounded-2xl border p-3"
              />
              <select
                name="deliveryMode"
                className="rounded-2xl border p-3"
              >
                <option value="recorded">
                  دروس مسجلة
                </option>
                <option value="live">
                  دروس مباشرة
                </option>
                <option value="mixed">
                  مسجلة + مباشرة
                </option>
              </select>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-bold text-[#51483d]">
                  بداية الدورة
                  <input
                    name="startsAt"
                    type="datetime-local"
                    className="mt-2 w-full rounded-2xl border p-3"
                  />
                </label>
                <label className="text-sm font-bold text-[#51483d]">
                  نهاية الدورة
                  <input
                    name="endsAt"
                    type="datetime-local"
                    className="mt-2 w-full rounded-2xl border p-3"
                  />
                </label>
              </div>

              <input
                name="scheduleNote"
                placeholder="المواعيد: مثال الأحد والثلاثاء 7:00 مساءً"
                className="rounded-2xl border p-3"
              />

              <input
                name="maxStudents"
                type="number"
                min="1"
                max="10000"
                placeholder="الحد الأقصى للطلاب (اختياري)"
                className="rounded-2xl border p-3"
              />

              <button className="dadyoom-arabic-button rounded-2xl p-3 font-black text-white">
                إنشاء الدورة
              </button>
            </div>
          </form>

          <form
            className="rounded-[2rem] border bg-white p-5"
            onSubmit={async (event) => {
              event.preventDefault();
              await runAction(
                addMarketplaceLesson,
                new FormData(event.currentTarget),
              );
              event.currentTarget.reset();
            }}
          >
            <h2 className="text-xl font-black text-[#123f39]">
              أضف درسًا للدورة
            </h2>

            <div className="mt-4 grid gap-3">
              <select
                name="courseId"
                required
                className="rounded-2xl border p-3"
              >
                <option value="">
                  اختر الدورة
                </option>
                {courses.map((course) => (
                  <option
                    key={course.id}
                    value={course.id}
                  >
                    {course.title}
                  </option>
                ))}
              </select>

              <input
                name="title"
                required
                placeholder="عنوان الدرس"
                className="rounded-2xl border p-3"
              />

              <textarea
                name="description"
                rows={2}
                placeholder="وصف مختصر"
                className="rounded-2xl border p-3"
              />

              <textarea
                name="content"
                rows={5}
                placeholder="محتوى أو تعليمات الدرس"
                className="rounded-2xl border p-3"
              />

              <input
                name="videoUrl"
                placeholder="رابط الفيديو إن وجد"
                className="rounded-2xl border p-3"
              />

              <input
                name="liveUrl"
                placeholder="رابط الحصة المباشرة إن وجد"
                className="rounded-2xl border p-3"
              />

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isPreview"
                />
                اجعل هذا الدرس معاينة مجانية
              </label>

              <button className="dadyoom-arabic-button rounded-2xl p-3 font-black text-white">
                إضافة الدرس
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-[2rem] border bg-white p-5">
          <h2 className="text-xl font-black text-[#123f39]">
            دوراتي
          </h2>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <article
                key={course.id}
                className="rounded-2xl border bg-[#fffaf0] p-4"
              >
                <b>{course.title}</b>
                <div className="mt-2 text-sm">
                  {Number(course.price).toFixed(3)}{" "}
                  {course.currency}
                </div>
                <div className="mt-1 text-xs text-[#746957]">
                  {course.status === "published"
                    ? "منشورة"
                    : "مسودة"}
                </div>
                {course.starts_at ? (
                  <div className="mt-2 text-xs font-bold text-[#51483d]">
                    تبدأ: {new Date(course.starts_at).toLocaleString("ar-BH")}
                  </div>
                ) : null}
                {course.schedule_note ? (
                  <div className="mt-1 text-xs text-[#746957]">
                    {course.schedule_note}
                  </div>
                ) : null}
                {course.max_students ? (
                  <div className="mt-1 text-xs text-[#746957]">
                    حتى {course.max_students} طالب
                  </div>
                ) : null}

                {course.status !== "published" ? (
                  <form
                    className="mt-3"
                    action={async (formData) => {
                      await runAction(
                        publishMarketplaceCourse,
                        formData,
                      );
                    }}
                  >
                    <input
                      type="hidden"
                      name="courseId"
                      value={course.id}
                    />
                    <button className="dadyoom-sand-button rounded-xl px-4 py-2 font-black">
                      نشر الدورة
                    </button>
                  </form>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <form
          className="rounded-[2rem] border bg-white p-5"
          onSubmit={async (event) => {
            event.preventDefault();
            await runAction(
              savePayoutProfile,
              new FormData(event.currentTarget),
            );
          }}
        >
          <h2 className="text-xl font-black text-[#123f39]">
            استلام أرباح المعلم
          </h2>
          <p className="mt-2 text-sm leading-7">
            أضف رقم BPay المسجل باسمك. يظهر للطالب فقط عند إنشاء طلب دفع لهذه الدورة، ولا نعرض بياناتك البنكية العامة.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              name="bpayName"
              defaultValue={payout?.bpay_name ?? ""}
              placeholder="الاسم المسجل في BPay"
              className="rounded-2xl border p-3"
            />
            <input
              name="bpayMobile"
              inputMode="tel"
              defaultValue={payout?.bpay_mobile ?? ""}
              placeholder="رقم BPay البحريني"
              className="rounded-2xl border p-3"
            />
            <input
              name="accountHolder"
              defaultValue={
                payout?.account_holder_name ?? ""
              }
              placeholder="اسم صاحب الحساب"
              className="rounded-2xl border p-3"
            />
            <input
              name="iban"
              defaultValue={payout?.iban ?? ""}
              placeholder="IBAN"
              className="rounded-2xl border p-3"
            />
            <input
              name="bankName"
              defaultValue={payout?.bank_name ?? ""}
              placeholder="اسم البنك"
              className="rounded-2xl border p-3"
            />
            <input
              name="swift"
              defaultValue={payout?.swift_bic ?? ""}
              placeholder="SWIFT / BIC"
              className="rounded-2xl border p-3"
            />
            <input
              name="country"
              defaultValue={payout?.country ?? ""}
              placeholder="الدولة"
              className="rounded-2xl border p-3"
            />
            <button className="dadyoom-arabic-button sm:col-span-2 rounded-2xl p-3 font-black text-white">
              حفظ بيانات BPay والاستلام
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
