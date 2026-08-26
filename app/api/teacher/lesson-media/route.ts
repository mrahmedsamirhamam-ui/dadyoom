
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "lesson-media";
const imageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const audioTypes = new Set(["audio/mpeg", "audio/wav", "audio/x-wav", "audio/ogg", "audio/webm", "audio/mp4"]);

function clean(value: FormDataEntryValue | null, max = 1000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

function extensionFor(type: string) {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/ogg": "ogg",
    "audio/webm": "webm",
    "audio/mp4": "m4a",
  };
  return map[type] ?? "bin";
}

async function requireLessonAccess(lessonId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "يجب تسجيل الدخول.", status: 401 } as const;

  const [{ data: profile }, { data: lesson, error: lessonError }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    supabase.from("lessons").select("id,created_by").eq("id", lessonId).maybeSingle(),
  ]);

  if (lessonError || !lesson) return { error: "الدرس غير موجود.", status: 404 } as const;
  const role = profile?.role?.trim().toLowerCase() ?? "";

  if (role !== "admin" && !(role === "teacher" && lesson.created_by === user.id)) {
    return { error: "غير مصرح لك بتعديل وسائط هذا الدرس.", status: 403 } as const;
  }

  return { user, role } as const;
}

async function ensureBucket(admin: ReturnType<typeof createAdminClient>) {
  const { data: buckets, error } = await admin.storage.listBuckets();
  if (error) throw error;
  if (buckets?.some((bucket) => bucket.name === BUCKET)) return;

  const { error: createError } = await admin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
  });
  if (createError && !/already exists/i.test(createError.message)) throw createError;
}

async function uploadMedia(
  admin: ReturnType<typeof createAdminClient>,
  file: File,
  kind: "image" | "audio",
  lessonId: string,
  activityId: string
) {
  const allowed = kind === "image" ? imageTypes : audioTypes;
  const maxSize = kind === "image" ? 5 * 1024 * 1024 : 10 * 1024 * 1024;

  if (!allowed.has(file.type)) throw new Error(kind === "image" ? "صيغة الصورة غير مدعومة." : "صيغة الملف الصوتي غير مدعومة.");
  if (file.size <= 0 || file.size > maxSize) throw new Error(kind === "image" ? "حجم الصورة يجب ألا يتجاوز 5 ميجابايت." : "حجم الصوت يجب ألا يتجاوز 10 ميجابايت.");

  const objectPath = `${lessonId}/${activityId}/${kind}-${randomUUID()}.${extensionFor(file.type)}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await admin.storage.from(BUCKET).upload(objectPath, bytes, {
    contentType: file.type,
    upsert: false,
    cacheControl: "31536000",
  });
  if (error) throw error;

  return admin.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const lessonId = clean(formData.get("lesson_id"), 100);
    let activityId = clean(formData.get("activity_id"), 100);
    const title = clean(formData.get("title"), 200);
    const instructions = clean(formData.get("instructions"), 2000);
    const activityType = clean(formData.get("activity_type"), 50) || "reading";
    const audioTextInput = clean(formData.get("audio_text"), 4000);
    const pointsRaw = Number(clean(formData.get("points"), 10));
    const points = Number.isInteger(pointsRaw) && pointsRaw > 0 ? Math.min(pointsRaw, 100) : 5;
    const removeImage = formData.get("remove_image") === "on";
    const removeAudio = formData.get("remove_audio") === "on";
    const image = formData.get("image");
    const audio = formData.get("audio");

    if (!lessonId) return NextResponse.json({ error: "معرّف الدرس مطلوب." }, { status: 400 });
    const access = await requireLessonAccess(lessonId);
    if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

    const admin = createAdminClient();
    await ensureBucket(admin);

    let activity: { id: string; content: unknown; title: string; instructions: string | null } | null = null;

    if (activityId) {
      const { data, error } = await admin
        .from("lesson_activities")
        .select("id,content,title,instructions")
        .eq("id", activityId)
        .eq("lesson_id", lessonId)
        .maybeSingle();
      if (error || !data) return NextResponse.json({ error: "النشاط غير موجود داخل هذا الدرس." }, { status: 404 });
      activity = data;
    } else {
      if (!title) return NextResponse.json({ error: "عنوان النشاط مطلوب." }, { status: 400 });
      if (!["reading", "listening", "speaking", "writing"].includes(activityType)) {
        return NextResponse.json({ error: "نوع النشاط غير مدعوم في محرر الوسائط." }, { status: 400 });
      }

      const { data: last } = await admin
        .from("lesson_activities")
        .select("activity_order")
        .eq("lesson_id", lessonId)
        .order("activity_order", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data, error } = await admin
        .from("lesson_activities")
        .insert({
          lesson_id: lessonId,
          title,
          activity_type: activityType,
          instructions: instructions || null,
          content: {},
          activity_order: Number(last?.activity_order ?? 0) + 1,
          points,
          is_published: true,
        })
        .select("id,content,title,instructions")
        .single();

      if (error || !data) throw error ?? new Error("تعذر إنشاء النشاط.");
      activity = data;
      activityId = data.id;
    }

    const content = asRecord(activity.content);

    if (removeImage) {
      delete content.image_url;
      delete content.teacher_media_enabled;
    }
    if (removeAudio) delete content.audio_url;

    if (image instanceof File && image.size > 0) {
      content.image_url = await uploadMedia(admin, image, "image", lessonId, activityId);
      content.teacher_media_enabled = true;
      content.image_source = "teacher";
      delete content.image_region;
    }

    if (audio instanceof File && audio.size > 0) {
      content.audio_url = await uploadMedia(admin, audio, "audio", lessonId, activityId);
    }

    const audioText = audioTextInput || (typeof content.audio_text === "string" ? content.audio_text.trim() : "");
    if (audioText) content.audio_text = audioText;
    else if (content.audio_url) content.audio_text = instructions || activity.instructions || title || activity.title;

    const { error: updateError } = await admin
      .from("lesson_activities")
      .update({
        title: title || activity.title,
        instructions: instructions || activity.instructions,
        points,
        content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activityId)
      .eq("lesson_id", lessonId);

    if (updateError) throw updateError;

    revalidatePath(`/teacher/${lessonId}`);
    revalidatePath(`/lessons/${lessonId}`);
    return NextResponse.json({ success: true, activityId });
  } catch (error) {
    console.error("TEACHER_LESSON_MEDIA_ERROR:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "تعذر حفظ الوسائط." },
      { status: 500 }
    );
  }
}
