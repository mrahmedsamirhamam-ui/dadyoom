import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { text } = await request.json();

  return NextResponse.json({
    success: true,
    result: {
      sentence: text,
      words: [
        {
          word: "أشرقت",
          type: "فعل ماضٍ",
          meaning: "طلعت وظهرت",
        },
        {
          word: "الشمس",
          type: "اسم",
          meaning: "النجم الذي يضيء الأرض",
        },
      ],
    },
  });
}