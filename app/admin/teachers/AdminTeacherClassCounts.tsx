"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

type TeacherClassCountsState = {
  counts: Record<string, number>;
  loading: boolean;
  error: boolean;
};

const ClassCountsContext = createContext<TeacherClassCountsState | null>(null);

/**
 * One supplementary browser RLS query for the visible teacher IDs.
 * The SSR route never waits for this expensive class list on Cloudflare.
 */
export default function AdminTeacherClassCounts({
  teacherIds,
  children,
}: {
  teacherIds: string[];
  children: ReactNode;
}) {
  const [state, setState] = useState<TeacherClassCountsState>({
    counts: {},
    loading: teacherIds.length > 0,
    error: false,
  });
  const idsKey = teacherIds.join(",");

  useEffect(() => {
    if (!idsKey) return;
    let active = true;
    const supabase = createClient();
    const ids = idsKey.split(",").filter(Boolean);

    void (async () => {
      const { data, error } = await supabase
        .from("teacher_classes")
        .select("teacher_id")
        .in("teacher_id", ids)
        .eq("is_active", true)
        .limit(2000);
      if (!active) return;

      if (error) {
        setState({ counts: {}, loading: false, error: true });
        return;
      }
      const counts: Record<string, number> = {};
      for (const item of data ?? []) {
        const id = String(item.teacher_id);
        counts[id] = (counts[id] ?? 0) + 1;
      }
      setState({ counts, loading: false, error: false });
    })();
    return () => { active = false; };
  }, [idsKey]);

  return (
    <ClassCountsContext.Provider value={state}>
      {children}
    </ClassCountsContext.Provider>
  );
}

export function TeacherClassCount({ teacherId }: { teacherId: string }) {
  const state = useContext(ClassCountsContext);
  if (!state || state.loading) return <span aria-label="جارٍ تحميل عدد الفصول">…</span>;
  if (state.error) return <span title="تعذر تحميل الفصول؛ حاول تحديث الصفحة">—</span>;
  return <span>{state.counts[teacherId] ?? 0}</span>;
}
