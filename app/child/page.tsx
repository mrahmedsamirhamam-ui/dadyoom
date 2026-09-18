import { redirect } from "next/navigation";

import EarlyLearningRoom from "@/components/child/EarlyLearningRoom";
import { createClient } from "@/lib/supabase/server";

export default async function ChildPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,full_name")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role?.trim().toLowerCase();

  if (role !== "child" && role !== "admin") {
    redirect("/student");
  }

  return (
    <EarlyLearningRoom
      childName={profile?.full_name || "صديق ضاديوم"}
    />
  );
}
