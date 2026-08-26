#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    import yt_dlp
except ImportError as exc:
    raise SystemExit(
        "yt-dlp is required. Run: python -m pip install --upgrade yt-dlp"
    ) from exc


ROOT = Path.cwd()
SOURCES_FILE = ROOT / "data" / "video-library" / "sources.json"
OUT_FILE = ROOT / "data" / "video-library" / "catalog.json"

EXCLUDE_PATTERNS = [
    r"\bshorts?\b",
    r"\btrailer\b",
    r"\bpromo\b",
    r"\bpromotion\b",
    r"\bmembers?\b",
    r"\bmembership\b",
    r"\bspots? left\b",
    r"\bsubscribe\b",
    r"\bgiveaway\b",
    r"\btajweed\b",
    r"\bqur'?an\b",
    r"\bsurah\b",
    r"\bduaa?\b",
    r"\bdua\b",
    r"تجويد",
    r"قرآن",
    r"القرآن",
    r"سورة",
    r"تلاوة",
    r"دعاء",
]

CATEGORY_PATTERNS = [
    (
        "الحروف والأصوات",
        [
            r"alphabet",
            r"letters?",
            r"phonics?",
            r"pronunciation",
            r"حروف",
            r"الأبجد",
            r"أصوات",
            r"النطق",
            r"مخارج",
        ],
    ),
    (
        "القراءة",
        [
            r"\bread",
            r"reading",
            r"قراءة",
            r"اقرأ",
            r"نصوص",
        ],
    ),
    (
        "المفردات",
        [
            r"vocab",
            r"words?",
            r"phrases?",
            r"مفردات",
            r"كلمات",
            r"عبارات",
            r"معاني",
        ],
    ),
    (
        "المحادثة",
        [
            r"conversation",
            r"speaking",
            r"\bspeak\b",
            r"dialog",
            r"محادثة",
            r"حوار",
            r"تحدث",
            r"التعارف",
        ],
    ),
    (
        "الاستماع",
        [
            r"listening",
            r"\blisten\b",
            r"podcast",
            r"استماع",
            r"مسموع",
        ],
    ),
    (
        "النحو والصرف",
        [
            r"grammar",
            r"conjug",
            r"verb",
            r"pronoun",
            r"syntax",
            r"نحو",
            r"إعراب",
            r"اعراب",
            r"صرف",
            r"فعل",
            r"فاعل",
            r"مفعول",
            r"مبتدأ",
            r"خبر",
            r"المشتقات",
        ],
    ),
    (
        "الإملاء والكتابة",
        [
            r"writing",
            r"\bwrite\b",
            r"spelling",
            r"handwriting",
            r"إملاء",
            r"املاء",
            r"كتابة",
            r"همز",
            r"ألف",
            r"تاء",
        ],
    ),
    (
        "الأدب والبلاغة",
        [
            r"literature",
            r"poetry",
            r"بلاغة",
            r"أدب",
            r"شعر",
            r"استعارة",
            r"تشبيه",
            r"كناية",
        ],
    ),
    (
        "اللهجات والثقافة",
        [
            r"dialect",
            r"culture",
            r"egyptian",
            r"levantine",
            r"moroccan",
            r"palestinian",
            r"لهجة",
            r"عامية",
            r"ثقافة",
            r"مصري",
            r"شامي",
            r"مغربي",
        ],
    ),
]

GENERAL_ARABIC_HINTS = [
    r"arabic",
    r"العربية",
    r"اللغة العربية",
    r"نحو",
    r"إعراب",
    r"اعراب",
    r"إملاء",
    r"املاء",
    r"بلاغة",
    r"أدب",
    r"قراءة",
    r"كتابة",
    r"كلمات",
    r"مفردات",
    r"حروف",
    r"محادثة",
    r"تعبير",
]

BOOK_EXERCISE_HINTS = [
    r"كتاب الأضواء",
    r"كتاب الامتحان",
    r"كتاب الامتياز",
    r"كتاب البرهان",
    r"حل تدريبات",
    r"حل تطبيقات",
    r"صفحة \d+",
    r"ص \d+",
]


def compact(value: object) -> str:
    return " ".join(str(value or "").split())


def matches_any(text: str, patterns: list[str]) -> bool:
    return any(
        re.search(pattern, text, re.IGNORECASE)
        for pattern in patterns
    )


def educational_enough(title: str, source_key: str) -> bool:
    if not title:
        return False

    if matches_any(title, EXCLUDE_PATTERNS):
        return False

    if source_key == "native-dhad":
        # Keep the native room varied and useful beyond one commercial workbook.
        if matches_any(title, BOOK_EXERCISE_HINTS):
            return False

    if source_key in {
        "arabicpod101",
        "arabic101",
        "maha",
        "khatawaat",
        "arabic-with-sam",
        "master-arabic",
    }:
        # These channels are primarily Arabic-learning channels, but this
        # still removes obvious off-topic uploads.
        return (
            matches_any(title, GENERAL_ARABIC_HINTS)
            or len(title) >= 12
        )

    return matches_any(title, GENERAL_ARABIC_HINTS)


def category_for(title: str) -> str:
    for category, patterns in CATEGORY_PATTERNS:
        if matches_any(title, patterns):
            return category

    return "مهارات عربية متنوعة"


def spaced_sample(items: list[dict], count: int) -> list[dict]:
    if count <= 0 or not items:
        return []

    if len(items) <= count:
        return items[:]

    if count == 1:
        return [items[0]]

    selected: list[dict] = []
    used: set[int] = set()

    for step in range(count):
        index = round(
            step * (len(items) - 1) / (count - 1)
        )

        if index in used:
            continue

        used.add(index)
        selected.append(items[index])

    if len(selected) < count:
        for index, item in enumerate(items):
            if index in used:
                continue

            selected.append(item)

            if len(selected) >= count:
                break

    return selected[:count]


def extract_source(source: dict) -> list[dict]:
    url = source["url"]
    scan = int(source["scan"])

    print(
        f"SOURCE_SCAN={source['key']} LIMIT={scan} URL={url}",
        flush=True,
    )

    options = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": "in_playlist",
        "skip_download": True,
        "playlistend": scan,
        "ignoreerrors": True,
        "socket_timeout": 20,
        "retries": 3,
    }

    with yt_dlp.YoutubeDL(options) as ydl:
        info = ydl.extract_info(
            url,
            download=False,
        )

    entries = (
        info.get("entries", [])
        if isinstance(info, dict)
        else []
    )

    videos: list[dict] = []
    local_seen: set[str] = set()

    for entry in entries:
        if not isinstance(entry, dict):
            continue

        video_id = compact(entry.get("id"))
        title = compact(entry.get("title"))

        if (
            not video_id
            or video_id in local_seen
            or title in {
                "[Private video]",
                "[Deleted video]",
            }
        ):
            continue

        if not educational_enough(
            title,
            source["key"],
        ):
            continue

        local_seen.add(video_id)

        videos.append(
            {
                "id": video_id,
                "title": title,
                "url":
                    f"https://www.youtube.com/watch?v={video_id}",
                "embedUrl":
                    f"https://www.youtube-nocookie.com/embed/{video_id}",
                "thumbnail":
                    f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
                "channel":
                    compact(
                        entry.get("channel")
                        or entry.get("uploader")
                        or source["name"]
                    ),
                "sourceKey":
                    source["key"],
                "sourceName":
                    source["name"],
                "room":
                    source["room"],
                "category":
                    category_for(title),
            }
        )

    print(
        f"SOURCE_VALID={source['key']} VIDEOS={len(videos)}",
        flush=True,
    )

    return videos


def interleave(groups: dict[str, list[dict]], order: list[str]) -> list[dict]:
    output: list[dict] = []
    max_len = max(
        (len(groups.get(key, [])) for key in order),
        default=0,
    )

    for index in range(max_len):
        for key in order:
            items = groups.get(key, [])

            if index < len(items):
                output.append(items[index])

    return output


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--target",
        type=int,
        default=500,
    )
    args = parser.parse_args()

    config = json.loads(
        SOURCES_FILE.read_text(
            encoding="utf-8"
        )
    )

    target = int(args.target)

    if target < 500:
        raise SystemExit(
            "Target must be at least 500 for the first Dadyoom video library."
        )

    sources = config["sources"]

    all_candidates: dict[str, list[dict]] = {}
    source_errors: dict[str, str] = {}

    for source in sources:
        try:
            all_candidates[source["key"]] = extract_source(source)
        except Exception as exc:
            source_errors[source["key"]] = str(exc)
            all_candidates[source["key"]] = []
            print(
                f"SOURCE_ERROR={source['key']} MESSAGE={exc}",
                file=sys.stderr,
                flush=True,
            )

    selected_by_source: dict[str, list[dict]] = {}
    selected_ids: set[str] = set()

    for source in sources:
        candidates = all_candidates[source["key"]]
        quota = int(source["quota"])

        chosen = spaced_sample(
            [
                item
                for item in candidates
                if item["id"] not in selected_ids
            ],
            quota,
        )

        selected_by_source[source["key"]] = chosen

        for item in chosen:
            selected_ids.add(item["id"])

        print(
            f"SOURCE_SELECTED={source['key']} TARGET={quota} ACTUAL={len(chosen)}",
            flush=True,
        )

    current_total = sum(
        len(items)
        for items in selected_by_source.values()
    )

    if current_total < target:
        missing = target - current_total

        print(
            f"FALLBACK_FILL_REQUIRED={missing}",
            flush=True,
        )

        fallback_pool: list[dict] = []

        for source in sources:
            for item in all_candidates[source["key"]]:
                if item["id"] in selected_ids:
                    continue

                fallback_pool.append(item)

        fallback = spaced_sample(
            fallback_pool,
            missing,
        )

        for item in fallback:
            selected_ids.add(item["id"])

            selected_by_source.setdefault(
                item["sourceKey"],
                [],
            ).append(item)

    ordered = interleave(
        selected_by_source,
        [source["key"] for source in sources],
    )

    unique: list[dict] = []
    final_seen: set[str] = set()

    for item in ordered:
        if item["id"] in final_seen:
            continue

        final_seen.add(item["id"])
        unique.append(item)

        if len(unique) >= target:
            break

    if len(unique) < target:
        print(
            "ERROR=COULD_NOT_REACH_500_UNIQUE_REAL_VIDEOS",
            file=sys.stderr,
        )

        print(
            f"UNIQUE_FOUND={len(unique)}",
            file=sys.stderr,
        )

        if source_errors:
            for key, message in source_errors.items():
                print(
                    f"FAILED_SOURCE={key} MESSAGE={message}",
                    file=sys.stderr,
                )

        return 2

    videos = []

    for index, item in enumerate(
        unique[:target],
        start=1,
    ):
        videos.append(
            {
                **item,
                "libraryIndex": index,
            }
        )

    counts_by_source: dict[str, int] = {}
    counts_by_category: dict[str, int] = {}
    counts_by_room: dict[str, int] = {}

    for item in videos:
        counts_by_source[item["sourceKey"]] = (
            counts_by_source.get(
                item["sourceKey"],
                0,
            )
            + 1
        )

        counts_by_category[item["category"]] = (
            counts_by_category.get(
                item["category"],
                0,
            )
            + 1
        )

        counts_by_room[item["room"]] = (
            counts_by_room.get(
                item["room"],
                0,
            )
            + 1
        )

    output = {
        "schemaVersion": 1,
        "generatedAt":
            datetime.now(timezone.utc).isoformat(),
        "target": target,
        "total": len(videos),
        "strategy":
            "Curated channel mix; flat metadata only; videos remain hosted on YouTube.",
        "sources": [
            {
                "key": source["key"],
                "name": source["name"],
                "url": source["url"],
                "room": source["room"],
                "requestedQuota": source["quota"],
                "selected":
                    counts_by_source.get(
                        source["key"],
                        0,
                    ),
            }
            for source in sources
        ],
        "countsBySource": counts_by_source,
        "countsByCategory": counts_by_category,
        "countsByRoom": counts_by_room,
        "videos": videos,
    }

    OUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    OUT_FILE.write_text(
        json.dumps(
            output,
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    print(
        f"VIDEO_LIBRARY_TOTAL={len(videos)}"
    )
    print(
        f"VIDEO_LIBRARY_UNIQUE={len(final_seen)}"
    )
    print(
        "VIDEO_LIBRARY_REAL_YOUTUBE_IDS=YES"
    )
    print(
        f"OUTPUT={OUT_FILE}"
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
