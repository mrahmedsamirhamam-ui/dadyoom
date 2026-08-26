
import Navbar from "@/components/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
