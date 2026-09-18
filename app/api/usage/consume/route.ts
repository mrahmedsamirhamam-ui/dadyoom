import { NextResponse } from "next/server";

import { consumeFeature } from "@/lib/billing/access";

const allowedFeatures = new Set([
  "video_ai",
  "pptx",
  "summary",
  "flashcards",
  "study_guide",
  "concept_map",
  "notebook_answer",
  "dad_chat",
  "game_ai",
]);

export async function POST(request: Request) {
  const body = (await request.json()) as { feature?: string };
  const feature = String(body.feature ?? "").trim();

  if (!allowedFeatures.has(feature)) {
    return NextResponse.json(
      { error: "الميزة غير معروفة." },
      { status: 400 },
    );
  }

  const result = await consumeFeature(feature);

  return NextResponse.json(result, {
    status: result.allowed ? 200 : 429,
  });
}
