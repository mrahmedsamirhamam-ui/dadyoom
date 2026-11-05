import { createClient } from "@/lib/supabase/server";

const routes: Record<string,string> = {
  student:"/student", child:"/child", teacher:"/teacher",
  parent:"/parent", school:"/school", admin:"/admin",
};

export async function signedInDestination() {
  const db = await createClient();
  const {data:{user}}=await db.auth.getUser();
  if(!user) return null;
  const {data:profile}=await db.from("profiles")
    .select("role,country,full_name").eq("id",user.id).maybeSingle();
  if(!profile?.role || !profile.country || !profile.full_name?.trim()) return "/onboarding";
  return routes[profile.role.trim().toLowerCase()] ?? "/onboarding";
}
