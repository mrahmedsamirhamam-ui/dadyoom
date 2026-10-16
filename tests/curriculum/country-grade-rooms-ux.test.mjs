import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

const read = (file) => readFileSync(file, "utf8");
const country = read("app/curriculum/[country]/page.tsx");
const grade = read("app/curriculum/[country]/[grade]/page.tsx");
const coursePage = read("app/courses/page.tsx");
const catalog = read("app/courses/CurriculumCatalogClient.tsx");
const api = read("app/api/courses/catalog/route.ts");
const roomHub = read("app/courses/rooms/page.tsx");
const room = read("components/courses/RoomCustomizer.tsx");
const videos = read("components/courses/VideoLibraryClient.tsx");
const live = read("components/live/DadyoomLiveRoom.tsx");
const session = read("app/live/[id]/LiveSessionClient.tsx");
const styles = read("app/globals.css");

describe("Actual country, stage, grade and lesson pathways", () => {
  test("all countries can open the full curriculum with their own selected grade", () => {
    expect(country).toContain("/courses?country=");
    expect(grade).toContain("/courses?country=");
    expect(coursePage).toContain("searchParams: Promise<CourseSearchParams>");
    expect(coursePage).toContain('item.code === (rawCountry ?? "").trim().toUpperCase()');
    expect(coursePage).toContain("requestedGrade <= (country?.maxGrade ?? 12)");
    expect(coursePage).toContain("initialCountryCode={country?.code");
    expect(coursePage).toContain("initialGradeNumber={grade}");
    expect(catalog).toContain("initialCountryCode = \"BH\"");
    expect(catalog).toContain("useState(validInitialGrade)");
  });

  test("school stage selects only its own grades and lessons come from active country+grade", () => {
    expect(catalog).toContain("stageName(gradeNumber, country)");
    expect(catalog).toContain("gradesInStage");
    expect(catalog).toContain('label={language === "en" ? "School stage" : "المرحلة الدراسية"}');
    expect(catalog).toContain("countryCode !== \"EG\"");
    expect(api).toContain('.eq(\n        "grade_number",\n        gradeNumber,');
    expect(api).toContain('.eq(\n        "country_id",\n        country.id,');
    expect(api).toContain('.eq(\n        "status",\n        "published",');
  });

  test("country page no longer truncates unit links to two items", () => {
    expect(country).toContain("unit.lessons.map((lesson)");
    expect(country).not.toContain("unit.lessons.slice(0, 2)");
    expect(country).toContain("<details key={unit.id}");
    expect(country).toContain("كل دروس هذا الصف والفصول في المستكشف");
    expect(grade).toContain("فتح جميع دروس الصف والمنهج والفصل");
  });
});

describe("Real learning room preferences instead of dummy buttons", () => {
  test("customizer choices all link to implemented learning pages", () => {
    expect(roomHub).toContain("<RoomCustomizer countries={countries}");
    expect(room).toContain('type Room = "native" | "non-native"');
    expect(room).toContain('type Activity = "lessons" | "videos"');
    expect(room).toContain("onClick={() => setRoom(item.value)}");
    expect(room).toContain("onClick={() => setActivity(item.value)}");
    expect(room).toContain("setCountryCode(event.target.value)");
    expect(room).toContain('"/courses/arabic-from-zero"');
    expect(room).toContain("/courses?country=");
    expect(room).toContain("/courses/video-library?room=");
    expect(room).toContain("href={destination}");
  });

  test("video player respects the active room and chosen focus", () => {
    expect(videos).toContain('search.get("focus")');
    expect(videos).toContain("selectedFocus");
    expect(videos).toContain("filtered.some(video => video.id === selected.id)");
    expect(videos).toContain("visibleSelected");
  });

  test("live classroom has functional layout, help and invite controls", () => {
    expect(live).toContain("aria-pressed={wide}");
    expect(live).toContain("onClick={() => setWide((current) => !current)}");
    expect(live).toContain("onClick={() => setShowHelp((current) => !current)}");
    expect(live).toContain("<CopyLiveLinkButton sessionId={sessionId}");
    expect(session).toContain("sessionId={sessionId}");
    expect(live).toContain("audio={false}");
    expect(live).toContain("video={false}");
    expect(styles).toContain("DADYOOM_SHARED_INTERACTION_POLISH_V1");
  });
});
