import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StudentSetupForm from "./StudentSetupForm";

export default async function StudentSetupPage() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await db.from("profiles")
    .select("country,grade_number,role").eq("id", user.id).maybeSingle();
  const selected = user.user_metadata?.dadyoom_learning_preferences;
  const preference = selected && typeof selected === "object" ? selected as Record<string, unknown> : {};
  return (
    <main className="min-h-[70vh] bg-[#f8faf9] px-4 py-8" dir="rtl">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-bold text-[#173f35]">منهجي المفضل</h1>
        <p className="mt-2 leading-8 text-[#526b61]">
          اختر هذه المعلومات مرة واحدة. سيحتفظ ضاديوم بها في حسابك لتعود إلى غرفتك مباشرة.
        </p>
        <StudentSetupForm
          initialCountry={profile?.country || "BH"}
          initialGrade={profile?.grade_number ?? 1}
          initialTrack={preference.track === "non_native" ? "non_native" : "native"}
          initialMode={preference.mode === "dadyoom" ? "dadyoom" : "ministry"}
        />
      </div>
    </main>
  );
}
