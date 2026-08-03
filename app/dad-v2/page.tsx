import { DadCharacterV2 } from "@/components/dad-v2";

export default function Page() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100">
      <DadCharacterV2
        state="idle"
        size={220}
      />
    </main>
  );
}