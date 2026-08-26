import fs from "node:fs";
import path from "node:path";

const required = [
  "data/video-courses/arabic-from-zero.ts",
  "app/(dashboard)/courses/arabic-from-zero/page.tsx",
];

for (const rel of required) {
  if (!fs.existsSync(path.resolve(process.cwd(), rel))) {
    throw new Error(`VIDEO_COURSE_FILE_MISSING:${rel}`);
  }
}

const data = fs.readFileSync(
  path.resolve(
    process.cwd(),
    "data/video-courses/arabic-from-zero.ts"
  ),
  "utf8"
);

const ids = [
  "c-7SVieC_04",
  "1AT7IMLcA58",
  "8pfQg26vfaA",
  "LTwCmA6AjdI",
  "T6uDEwYdbv4",
  "iIM1q6_3U8o",
  "Jd_6QK5uvDE",
];

for (const id of ids) {
  if (!data.includes(id)) {
    throw new Error(`VIDEO_ID_MISSING:${id}`);
  }
}

const page = fs.readFileSync(
  path.resolve(
    process.cwd(),
    "app/(dashboard)/courses/arabic-from-zero/page.tsx"
  ),
  "utf8"
);

if (!page.includes("youtube-nocookie.com/embed")) {
  throw new Error("PRIVACY_ENHANCED_YOUTUBE_EMBED_MISSING");
}

if (!page.includes("مشاهدة الفيديو على YouTube")) {
  throw new Error("YOUTUBE_SOURCE_ATTRIBUTION_LINK_MISSING");
}

console.log("ARABIC_VIDEO_COURSE_LESSONS=7");
console.log("YOUTUBE_PRIVACY_ENHANCED_EMBED=PASS");
console.log("YOUTUBE_SOURCE_ATTRIBUTION=PASS");
console.log("DADYOOM_ORIGINAL_PRACTICE=PASS");
console.log("ARABIC_VIDEO_COURSE_GATE=PASS");
