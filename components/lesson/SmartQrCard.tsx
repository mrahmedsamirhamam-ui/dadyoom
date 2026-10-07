import Image from "next/image";
import Link from "next/link";

export default function SmartQrCard({
  lessonId,
  lessonTitle,
}: {
  lessonId: string;
  lessonTitle: string;
}) {
  const qrSrc = "/api/qr/lesson/" + lessonId;
  const scanPath = "/q/" + lessonId;

  return (
    <section className="lesson-arabic-card rounded-3xl border border-[#b8d8cf] bg-[#f1fbf7] p-5 shadow-sm">
      <div className="grid gap-5 sm:grid-cols-[180px_1fr] sm:items-center">
        <div className="mx-auto rounded-3xl bg-white p-3 shadow-sm ring-1 ring-[#d8ebe5]">
          <Image
            src={qrSrc}
            alt={"رمز QR الذكي لدرس " + lessonTitle}
            width={160}
            height={160}
            unoptimized
            className="h-40 w-40 rounded-2xl"
          />
        </div>

        <div>
          <div className="text-xs font-black text-[#247263]">
            Dadyoom Smart QR
          </div>
          <h2 className="mt-1 font-arabic-display text-xl font-black text-[#173f38]">
            من الورقة إلى الدرس التفاعلي بمسحة واحدة
          </h2>
          <p className="mt-2 leading-7 text-slate-600">
            اطبع هذا الرمز على ورقة العمل أو الملخص أو الكتاب. عند مسحه يفتح
            الطالب هذا الدرس مباشرة داخل ضاديوم، ويظل الرابط ثابتًا حتى لو
            تطورت تجربة الدرس لاحقًا.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={qrSrc + "?download=1"}
              className="rounded-2xl bg-[#123f39] px-5 py-3 font-black text-white"
            >
              تنزيل QR للطباعة
            </a>
            <Link
              href={scanPath}
              rel="nofollow"
              prefetch={false}
              className="rounded-2xl border border-[#8dc0b4] bg-white px-5 py-3 font-black text-[#173f38]"
            >
              اختبار الرمز
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
