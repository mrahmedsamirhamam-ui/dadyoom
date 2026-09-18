import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import PaidProductBuilder from "./PaidProductBuilder";

export default async function NewMarketplaceProductPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profile?.role !== "teacher" &&
    profile?.role !== "admin"
  ) {
    redirect("/student");
  }

  return (
    <main
      dir="rtl"
      className="mx-auto max-w-5xl space-y-6 px-4 py-8"
    >
      <section className="rounded-[2rem] bg-[#123f39] p-6 text-white">
        <div className="text-sm font-black text-[#f3d187]">
          متجر المعلم
        </div>

        <h1 className="mt-2 text-3xl font-black">
          بيع درس أو كورس
        </h1>

        <p className="mt-3 max-w-3xl leading-8 text-white/85">
          أنشئ المحتوى من حسابك وانشره في سوق ضاديوم. العمولة ثابتة في الخادم: 15% لضاديوم و85% للمعلم عند البيع.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/teacher/marketplace"
            className="rounded-xl bg-white/10 px-4 py-2 font-black"
          >
            إدارة السوق
          </Link>

          <Link
            href="/teacher/marketplace/earnings"
            className="rounded-xl bg-white/10 px-4 py-2 font-black"
          >
            أرباحي
          </Link>
        </div>
      </section>

      <PaidProductBuilder />
    </main>
  );
}
