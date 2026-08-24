import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

const ids = [
  "a899f6f1-5527-4ec2-a453-59514cdae646",
  "8b079392-0724-45cb-9051-4eda3f1c6b95",
  "78147988-ccfd-4658-83f6-a9195193f467",
  "6b63b00e-1807-44f3-a2d9-7926a7a79039",
  "775df43b-767f-45a0-80da-5dba4b4d2cee",
  "198081b9-e057-4311-a9d7-a60e4f3b0734",
  "f8674b69-8004-480f-b7ef-55475b8842da",
  "0fe360ad-ddb1-4c9c-ac43-9509a71c083a",
  "6f630dce-ba3e-4bbe-b1ad-ddccca56fb99",
  "ae938878-348e-4ac9-bd55-afb6fc6cea18",
  "7da994d1-7ecf-42cf-bbf0-edc724fafec6",
];

export async function GET() {
  try {
    const supabase =
      await createClient();

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "lesson_activities"
        )
        .select(`
          id,
          lesson_id,
          activity_order,
          title,
          activity_type,
          content,
          answer,
          is_published
        `)
        .in(
          "id",
          ids
        )
        .order(
          "lesson_id",
          {
            ascending: true,
          }
        )
        .order(
          "activity_order",
          {
            ascending: true,
          }
        );

    if (error) {
      throw error;
    }

    return NextResponse.json({
      ok: true,
      count:
        data?.length ?? 0,
      activities:
        data ?? [],
    });
  }
  catch (error) {
    console.error(
      "RUNTIME_MCQ_DUMP_ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "تعذر قراءة الأنشطة.",
      },
      {
        status: 500,
      }
    );
  }
}
