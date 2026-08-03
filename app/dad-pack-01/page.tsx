import { DadFoundation } from "@/components/dad/core";

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
     <DadFoundation state="idle" size={260} />
    </main>
  );
}