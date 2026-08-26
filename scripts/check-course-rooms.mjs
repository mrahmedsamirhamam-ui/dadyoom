import fs from "node:fs";
import path from "node:path";

const required = [
  "data/course-rooms/rooms.ts",
  "components/courses/CourseRoomCard.tsx",
  "app/(dashboard)/courses/rooms/page.tsx",
  "app/(dashboard)/courses/rooms/non-native/page.tsx",
  "app/(dashboard)/courses/rooms/native-arabic/page.tsx",
];

for (const rel of required) {
  if (!fs.existsSync(path.resolve(process.cwd(), rel))) {
    throw new Error(`COURSE_ROOM_FILE_MISSING:${rel}`);
  }
}

const rooms = fs.readFileSync(
  path.resolve(
    process.cwd(),
    "data/course-rooms/rooms.ts"
  ),
  "utf8"
);

for (const marker of [
  "غرفة العربية لغير الناطقين بها",
  "غرفة العربية للعرب",
  "/courses/rooms/non-native",
  "/courses/rooms/native-arabic",
]) {
  if (!rooms.includes(marker)) {
    throw new Error(`COURSE_ROOM_MARKER_MISSING:${marker}`);
  }
}

const nonNative = fs.readFileSync(
  path.resolve(
    process.cwd(),
    "app/(dashboard)/courses/rooms/non-native/page.tsx"
  ),
  "utf8"
);

if (!nonNative.includes("/courses/arabic-from-zero")) {
  throw new Error("NON_NATIVE_ROOM_DOES_NOT_LINK_VIDEO_COURSE");
}

const native = fs.readFileSync(
  path.resolve(
    process.cwd(),
    "app/(dashboard)/courses/rooms/native-arabic/page.tsx"
  ),
  "utf8"
);

for (const marker of [
  "/courses",
  "/teacher",
  "/student",
  "/reading-challenge",
  "/dictionary",
]) {
  if (!native.includes(marker)) {
    throw new Error(`NATIVE_ROOM_LINK_MISSING:${marker}`);
  }
}

console.log("COURSE_ROOMS=2");
console.log("NON_NATIVE_ARABIC_ROOM=PASS");
console.log("NATIVE_ARABIC_ROOM=PASS");
console.log("VIDEO_COURSE_LINKED=PASS");
console.log("TEACHER_STUDENT_PATHS=PASS");
console.log("COURSE_ROOMS_GATE=PASS");
