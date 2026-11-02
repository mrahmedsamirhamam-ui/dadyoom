import rawActivities from "@/data/coloring/320-manifest.json";

export type ColoringActivity = {
  volume: number;
  page: number;
  section: string;
  title: string;
  word: string;
  illustration: string;
  instruction: string;
  question: string;
};

export const COLORING_ACTIVITIES: readonly ColoringActivity[] =
  rawActivities as ColoringActivity[];

export function findColoringActivity(volume: string, page: string) {
  if (!/^volume-[12]$/.test(volume) || !/^page-\d{3}$/.test(page)) return undefined;
  const v = Number(volume.slice(7));
  const p = Number(page.slice(5));
  if (!Number.isInteger(p) || p < 1 || p > 160) return undefined;
  return COLORING_ACTIVITIES.find(a => a.volume === v && a.page === p);
}

export function getActivityChoices(activity: ColoringActivity): string[] {
  const alternatives = COLORING_ACTIVITIES
    .filter(a => a.volume === activity.volume && a.section === activity.section && a.word !== activity.word)
    .map(a => a.word)
    .filter((term, index, all) => all.indexOf(term) === index);
  const key = (activity.page - 1) % 3;
  const choices = alternatives.slice(0, 2);
  const options = choices.length === 2 ? choices : ["كلمة أخرى", "تعلم جديد"];
  options.splice(key, 0, activity.word);
  return options;
}

export function activityHref(activity: ColoringActivity): string {
  return `/activities/coloring/volume-${activity.volume}/page-${String(activity.page).padStart(3, "0")}`;
}
