import { redirect as dadyoomRedirect } from "next/navigation";
import { getDashboardRequestViewer } from "@/lib/auth/request-viewer";

import Navbar from "@/components/Navbar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // DADYOOM_PROFILE_COMPLETENESS_GATE
  const { user: dadyoomUser, profile: dadyoomProfile } =
    await getDashboardRequestViewer();

  if (!dadyoomUser) {
    dadyoomRedirect("/login");
  }

  const dadyoomRole = dadyoomProfile?.role?.trim().toLowerCase() ?? "";
  const dadyoomAllowedRoles = new Set(["student","child","teacher","parent","school","admin"]);

  const dadyoomProfileComplete = Boolean(
    dadyoomProfile?.full_name?.trim() &&
    dadyoomProfile?.country?.trim() &&
    dadyoomAllowedRoles.has(dadyoomRole)
  );

  if (!dadyoomProfileComplete) {
    dadyoomRedirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-[#fbf6ea] text-[#2b2823]">
      <Navbar />
      <main className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(circle at 8% 10%, rgba(198,145,48,.09) 0 1px, transparent 1.8px), radial-gradient(circle at 90% 15%, rgba(18,63,57,.07) 0 1px, transparent 1.8px)",
            backgroundSize: "28px 28px, 36px 36px",
          }}
        />
        {children}
      </main>
    </div>
  );
}
