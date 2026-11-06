import type { ReactNode } from "react";
import DadyoomLogo from "@/components/brand/DadyoomLogo";

/**
 * One focused authentication card. There is no duplicate marketing column,
 * extra navigation bar or competing action next to the page heading.
 */
export default function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main dir="rtl" className="flex min-h-screen items-start justify-center bg-[radial-gradient(circle_at_15%_0%,rgba(214,173,87,.16),transparent_38%),linear-gradient(180deg,#f5f8f3,#fffaf0)] px-4 py-8 text-[#173f38] sm:items-center sm:px-6 sm:py-12">
      <section aria-labelledby="auth-heading" className="w-full max-w-xl rounded-[1.75rem] border border-[#dce9db] bg-white/95 px-5 py-7 shadow-[0_24px_75px_rgba(18,63,57,.09)] sm:px-9 sm:py-9">
        <div className="flex justify-center">
          <DadyoomLogo href="/" />
        </div>
        <div className="mt-7 border-t border-[#e4eadd] pt-7 text-center">
          <h1 id="auth-heading" className="font-arabic-display text-2xl font-black leading-snug text-[#173f38] sm:text-3xl">{title}</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-[#617267]">{description}</p>
        </div>
        <div className="mt-7">{children}</div>
      </section>
    </main>
  );
}
