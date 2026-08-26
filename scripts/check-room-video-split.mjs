import fs from "node:fs";
import path from "node:path";

const file =
  path.resolve(
    process.cwd(),
    "data/video-library/catalog.json"
  );

const catalog =
  JSON.parse(
    fs.readFileSync(
      file,
      "utf8"
    )
  );

const nonNative =
  catalog.videos.filter(
    (video) =>
      video.room ===
        "non-native" ||
      video.room ===
        "both"
  );

const native =
  catalog.videos.filter(
    (video) =>
      video.room ===
        "native" ||
      video.room ===
        "both"
  );

const arabicInstruction =
  catalog.videos.filter(
    (video) =>
      video.instructionLanguage ===
      "arabic"
  );

const nativeArabicTeachers =
  native.filter(
    (video) =>
      video.instructionLanguage ===
      "arabic"
  );

if (catalog.videos.length < 500) {
  throw new Error(
    `TOTAL_BELOW_500:${catalog.videos.length}`
  );
}

if (nonNative.length < 250) {
  throw new Error(
    `NON_NATIVE_ROOM_TOO_SMALL:${nonNative.length}`
  );
}

if (native.length < 200) {
  throw new Error(
    `NATIVE_ROOM_TOO_SMALL:${native.length}`
  );
}

if (nativeArabicTeachers.length < 180) {
  throw new Error(
    `NATIVE_ARABIC_TEACHER_VIDEOS_TOO_SMALL:${nativeArabicTeachers.length}`
  );
}

console.log(
  `TOTAL_VIDEO_LIBRARY=${catalog.videos.length}`
);
console.log(
  `NON_NATIVE_ROOM_VIDEOS=${nonNative.length}`
);
console.log(
  `NATIVE_ROOM_VIDEOS=${native.length}`
);
console.log(
  `ARABIC_INSTRUCTION_VIDEOS=${arabicInstruction.length}`
);
console.log(
  `NATIVE_ARABIC_TEACHER_VIDEOS=${nativeArabicTeachers.length}`
);
console.log(
  "ROOM_VIDEO_SPLIT_GATE=PASS"
);
