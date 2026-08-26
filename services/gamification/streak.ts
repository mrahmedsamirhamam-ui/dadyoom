import type { SupabaseClient } from "@supabase/supabase-js";

export interface StudentStreak {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
}

export interface UpdateStreakParams {
  supabase: SupabaseClient;
  studentEmail: string;
  activityDate: Date;
}

function formatDateInBahrain(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bahrain",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Unable to determine the activity date.");
  }

  return `${year}-${month}-${day}`;
}

export async function updateStreak({
  supabase,
  studentEmail,
  activityDate,
}: UpdateStreakParams): Promise<StudentStreak> {
  const email = studentEmail.trim();

  if (!email) {
    throw new Error("Student email is required.");
  }

  if (Number.isNaN(activityDate.getTime())) {
    throw new Error("Activity date is invalid.");
  }

  const localActivityDate = formatDateInBahrain(activityDate);

  const { data, error } = await supabase.rpc(
    "update_student_streak",
    {
      p_student_email: email,
      p_activity_date: localActivityDate,
    }
  );

  if (error) {
    throw error;
  }

  const result = Array.isArray(data) ? data[0] : data;

  if (!result) {
    throw new Error("Streak update returned no result.");
  }

  return {
    currentStreak: result.current_streak,
    longestStreak: result.longest_streak,
    lastActivityDate: result.last_activity_date,
  };
}
