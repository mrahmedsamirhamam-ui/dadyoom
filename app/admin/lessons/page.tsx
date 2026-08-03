import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Lesson = {
  id: string;
  title: string;
  slug: string;
  skill: string;
  difficulty_level: string;
  estimated_minutes: number;
  points: number;
  is_published: boolean;
  created_at: string;
  units:
    | {
        title: string;
        grades:
          | {
              name_ar: string;
            }
          | {
              name_ar: string;
            }[]
          | null;
      }
    | {
        title: string;
        grades:
          | {
              name_ar: string;
            }
          | {
              name_ar: string;
            }[]
          | null;
      }[]
    | null;
};

function getRelation<T>(relation: T | T[] | null): T | null {
  if (!relation) return null;
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

function getSkillName(skill: string) {
  const names: Record<string, string> = {
    reading: "القراءة",
    writing: "الكتابة",
    listening: "الاستماع",
    speaking: "التحدث",
    grammar: "القواعد",
    vocabulary: "المفردات",
  };

  return names[skill] ?? skill;
}

function getDifficultyName(level: string) {
  const names: Record<string, string> = {
    beginner: "مبتدئ",
    intermediate: "متوسط",
    advanced: "متقدم",
  };

  return names[level] ?? level;
}

export default async function AdminLessonsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lessons")
    .select(`
      id,
      title,
      slug,
      skill,
      difficulty_level,
      estimated_minutes,
      points,
      is_published,
      created_at,
      units (
        title,
        grades (
          name_ar
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <h1 className="text-xl font-bold text-destructive">
          تعذر تحميل الدروس
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          {error.message}
        </p>
      </div>
    );
  }

  const lessons = (data ?? []) as Lesson[];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            إدارة الدروس
          </h1>

          <p className="mt-1 text-muted-foreground">
            عرض الدروس وإدارة محتوى منصة ضاديوم.
          </p>
        </div>

        <Button
          render={<Link href="/admin/lessons/new" />}
        >
          إضافة درس جديد
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            إجمالي الدروس
          </p>

          <p className="mt-2 text-3xl font-bold">
            {lessons.length}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            الدروس المنشورة
          </p>

          <p className="mt-2 text-3xl font-bold">
            {lessons.filter((lesson) => lesson.is_published).length}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            المسودات
          </p>

          <p className="mt-2 text-3xl font-bold">
            {lessons.filter((lesson) => !lesson.is_published).length}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">عنوان الدرس</TableHead>
              <TableHead className="text-right">الوحدة</TableHead>
              <TableHead className="text-right">الصف</TableHead>
              <TableHead className="text-right">المهارة</TableHead>
              <TableHead className="text-right">المستوى</TableHead>
              <TableHead className="text-right">المدة</TableHead>
              <TableHead className="text-right">النقاط</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {lessons.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-32 text-center text-muted-foreground"
                >
                  لا توجد دروس حتى الآن.
                </TableCell>
              </TableRow>
            ) : (
              lessons.map((lesson) => {
                const unit = getRelation(lesson.units);
                const grade = getRelation(unit?.grades ?? null);

                return (
                  <TableRow key={lesson.id}>
                    <TableCell className="font-medium">
                      {lesson.title}
                    </TableCell>

                    <TableCell>
                      {unit?.title ?? "غير محددة"}
                    </TableCell>

                    <TableCell>
                      {grade?.name_ar ?? "غير محدد"}
                    </TableCell>

                    <TableCell>
                      {getSkillName(lesson.skill)}
                    </TableCell>

                    <TableCell>
                      {getDifficultyName(lesson.difficulty_level)}
                    </TableCell>

                    <TableCell>
                      {lesson.estimated_minutes} دقيقة
                    </TableCell>

                    <TableCell>
                      {lesson.points}
                    </TableCell>

                    <TableCell>
                      {lesson.is_published ? (
                        <Badge>منشور</Badge>
                      ) : (
                        <Badge variant="secondary">
                          مسودة
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}