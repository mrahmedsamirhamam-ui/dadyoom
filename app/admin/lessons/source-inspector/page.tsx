import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import SourceInspector from "./source-inspector";


export default async function SourceInspectorPage() {
  const supabase =
    await createClient();


  const {
    data: {
      user,
    },
    error: userError,
  } =
    await supabase.auth.getUser();


  if (
    userError ||
    !user
  ) {
    redirect(
      "/login"
    );
  }


  const {
    data: profile,
    error: profileError,
  } =
    await supabase
      .from("profiles")
      .select("role")
      .eq(
        "id",
        user.id
      )
      .single();


  if (
    profileError ||
    profile?.role
      ?.trim()
      .toLowerCase() !==
      "admin"
  ) {
    redirect(
      "/"
    );
  }


  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div className="space-y-2">
        <Link
          href="/admin/lessons/new"
          className="text-sm text-muted-foreground underline"
        >
          {"\u2190 \u0627\u0644\u0639\u0648\u062f\u0629 \u0625\u0644\u0649 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062f\u0631\u0633"}
        </Link>

        <h1 className="text-3xl font-bold">
          {"\u0641\u062d\u0635 \u0646\u0635 \u0627\u0644\u0645\u0635\u062f\u0631"}
        </h1>

        <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
          {
            "\u0647\u0630\u0647 \u0627\u0644\u0623\u062f\u0627\u0629 \u062a\u0642\u0631\u0623 \u0627\u0644\u0631\u0627\u0628\u0637 \u0648\u062a\u0639\u0631\u0636 \u0627\u0644\u0646\u0635 \u0627\u0644\u0630\u064a \u064a\u0633\u062a\u062e\u0631\u062c\u0647 \u0636\u0627\u062f\u064a\u0648\u0645 \u0641\u0639\u0644\u064b\u0627. \u0644\u0627 \u062a\u0646\u0634\u0626 \u062f\u0631\u0633\u064b\u0627\u060c \u0648\u0644\u0627 \u062a\u062d\u0641\u0638 \u0634\u064a\u0626\u064b\u0627 \u0641\u064a \u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a\u060c \u0648\u0644\u0627 \u062a\u0633\u062a\u062f\u0639\u064a Gemini."
          }
        </p>
      </div>

      <SourceInspector />
    </main>
  );
}
