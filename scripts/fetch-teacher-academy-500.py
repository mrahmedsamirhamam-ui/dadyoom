#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
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
TOPICS_FILE = ROOT / "data" / "teacher-academy" / "topics.json"
OUT_FILE = ROOT / "data" / "teacher-academy" / "catalog.json"

ARABIC_RE = re.compile(r"[\u0600-\u06FF]")

EXCLUDE = [
    r"\bshorts?\b",
    r"\btrailer\b",
    r"\bpromo\b",
    r"\bgiveaway\b",
    r"\blive now\b",
    r"وظائف",
    r"توظيف",
    r"إعلان",
    r"اعلان",
    r"مسابقة",
    r"أغنية",
    r"اغنية",
    r"كليب",
    r"ترفيه",
]

EDU_HINTS = [
    r"معلم",
    r"المعلم",
    r"المعلمين",
    r"المعلمات",
    r"التعليم",
    r"التدريس",
    r"استراتيج",
    r"الصف",
    r"الطلاب",
    r"الطالب",
    r"التعلم",
    r"تقويم",
    r"اختبار",
    r"درس",
    r"دروس",
    r"تدريب",
    r"ورشة",
    r"محاضرة",
    r"مهارات",
    r"تعليم",
    r"نحو",
    r"قراءة",
    r"إملاء",
    r"املاء",
    r"كتابة",
    r"تعبير",
    r"الذكاء الاصطناعي",
    r"القيادة",
    r"صعوبات التعلم",
    r"التربية",
    r"تربوي",
    r"تربوية",
    r"التنمية المهنية",
    r"التطوير المهني",
    r"بحث إجرائي",
    r"البحث الإجرائي",
    r"مجتمعات التعلم",
    r"صحة نفسية",
    r"الصحة النفسية",
    r"الاحتراق",
    r"احتراق",
    r"الضغوط",
    r"ضغوط",
    r"الإجهاد",
    r"اجهاد",
    r"التوتر",
    r"الرفاه",
    r"التوازن",
]

SPECIAL_FALLBACKS = {
    "teacher-wellbeing": [
        "الصحة النفسية للمعلمين",
        "الاحتراق النفسي لدى المعلمين",
        "إدارة الضغوط للمعلمين",
        "الرفاه النفسي للمعلمين",
        "التوازن بين العمل والحياة للمعلمين",
        "إدارة التوتر والضغط النفسي للمعلمين",
        "دعم الصحة النفسية للمعلم",
        "الاحتراق الوظيفي في التعليم",
    ],
    "professional-development": [
        "التنمية المهنية للمعلمين",
        "التطوير المهني المستمر للمعلمين",
        "البحث الإجرائي للمعلمين",
        "مجتمعات التعلم المهنية للمعلمين",
        "التأمل المهني للمعلمين",
        "كفايات المعلم المهنية",
        "تطوير أداء المعلم",
        "النمو المهني للمعلمين",
    ],
    "parent-communication": [
        "التواصل الفعال مع أولياء الأمور للمعلمين",
        "الشراكة بين المدرسة والأسرة",
        "اجتماعات أولياء الأمور للمعلمين",
    ],
    "time-management": [
        "إدارة وقت المعلم",
        "إدارة وقت الحصة",
        "تنظيم الوقت للمعلمين",
    ],
    "educational-leadership": [
        "القيادة التعليمية للمعلمين",
        "القيادة المدرسية تدريب",
        "المعلم القائد",
    ],
}


def compact(value: object) -> str:
    return " ".join(str(value or "").split())


def matches_any(text: str, patterns: list[str]) -> bool:
    return any(
        re.search(pattern, text, re.IGNORECASE)
        for pattern in patterns
    )


def usable_title(title: str) -> bool:
    if not title:
        return False

    if not ARABIC_RE.search(title):
        return False

    if matches_any(title, EXCLUDE):
        return False

    return matches_any(title, EDU_HINTS)


def search(query: str, limit: int) -> list[dict]:
    target = f"ytsearch{limit}:{query}"

    options = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": "in_playlist",
        "skip_download": True,
        "ignoreerrors": True,
        "socket_timeout": 25,
        "retries": 3,
    }

    with yt_dlp.YoutubeDL(options) as ydl:
        info = ydl.extract_info(
            target,
            download=False,
        )

    entries = (
        info.get("entries", [])
        if isinstance(info, dict)
        else []
    )

    output: list[dict] = []

    for entry in entries:
        if not isinstance(entry, dict):
            continue

        video_id = compact(entry.get("id"))
        title = compact(entry.get("title"))

        if not video_id or not usable_title(title):
            continue

        output.append(
            {
                "id": video_id,
                "title": title,
                "channel": compact(
                    entry.get("channel")
                    or entry.get("uploader")
                    or "YouTube"
                ),
                "url":
                    f"https://www.youtube.com/watch?v={video_id}",
                "embedUrl":
                    f"https://www.youtube-nocookie.com/embed/{video_id}",
                "thumbnail":
                    f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
            }
        )

    return output


def add_query_results(
    *,
    query: str,
    limit: int,
    candidates: list[dict],
    local_seen: set[str],
    slug: str,
) -> None:
    print(
        f"TRACK_SEARCH={slug} QUERY={query}",
        flush=True,
    )

    try:
        results = search(
            query,
            limit,
        )
    except Exception as exc:
        print(
            f"SEARCH_ERROR={slug} MESSAGE={exc}",
            file=sys.stderr,
            flush=True,
        )
        return

    for item in results:
        if item["id"] in local_seen:
            continue

        local_seen.add(item["id"])
        candidates.append(item)


def choose_unique(
    *,
    candidates: list[dict],
    needed: int,
    global_seen: set[str],
    channel_counts: dict[str, int],
) -> list[dict]:
    chosen: list[dict] = []

    for item in candidates:
        if len(chosen) >= needed:
            break

        if item["id"] in global_seen:
            continue

        channel = item["channel"]

        if channel_counts.get(channel, 0) >= 35:
            continue

        chosen.append(item)
        global_seen.add(item["id"])
        channel_counts[channel] = (
            channel_counts.get(channel, 0)
            + 1
        )

    if len(chosen) < needed:
        for item in candidates:
            if len(chosen) >= needed:
                break

            if item["id"] in global_seen:
                continue

            chosen.append(item)
            global_seen.add(item["id"])

            channel = item["channel"]
            channel_counts[channel] = (
                channel_counts.get(channel, 0)
                + 1
            )

    return chosen


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--target",
        type=int,
        default=500,
    )
    parser.add_argument(
        "--per-track",
        type=int,
        default=20,
    )
    args = parser.parse_args()

    topics_doc = json.loads(
        TOPICS_FILE.read_text(
            encoding="utf-8"
        )
    )

    tracks = topics_doc["tracks"]

    if args.target < 500:
        raise SystemExit(
            "Teacher academy target must be at least 500."
        )

    if len(tracks) * args.per_track < args.target:
        raise SystemExit(
            "Not enough configured track capacity for requested target."
        )

    global_seen: set[str] = set()
    channel_counts: dict[str, int] = {}
    final: list[dict] = []

    for track in tracks:
        slug = track["slug"]
        needed = args.per_track

        queries = [
            track["query"],
            f"دورة {track['query']}",
            f"ورشة {track['query']}",
            f"تدريب معلمين {track['title']}",
            f"{track['title']} للمعلمين",
            f"مهارات {track['title']} للمعلمين",
        ]

        queries.extend(
            SPECIAL_FALLBACKS.get(
                slug,
                [],
            )
        )

        candidates: list[dict] = []
        local_seen: set[str] = set()

        for query in queries:
            add_query_results(
                query=query,
                limit=55,
                candidates=candidates,
                local_seen=local_seen,
                slug=slug,
            )

        chosen = choose_unique(
            candidates=candidates,
            needed=needed,
            global_seen=global_seen,
            channel_counts=channel_counts,
        )

        if len(chosen) < needed:
            missing = needed - len(chosen)

            recovery_queries = [
                f"{track['title']} شرح للمعلمين",
                f"{track['title']} دورة تدريبية",
                f"{track['title']} ورشة تربوية",
                f"{track['title']} مهارات تربوية",
                f"التنمية المهنية {track['title']}",
            ]

            recovery_queries.extend(
                SPECIAL_FALLBACKS.get(
                    slug,
                    [],
                )
            )

            recovery_candidates: list[dict] = []

            for query in recovery_queries:
                add_query_results(
                    query=query,
                    limit=80,
                    candidates=recovery_candidates,
                    local_seen=local_seen,
                    slug=slug,
                )

            more = choose_unique(
                candidates=recovery_candidates,
                needed=missing,
                global_seen=global_seen,
                channel_counts=channel_counts,
            )

            chosen.extend(more)

        if len(chosen) < needed:
            print(
                f"ERROR=TRACK_BELOW_TARGET TRACK={slug} FOUND={len(chosen)} TARGET={needed}",
                file=sys.stderr,
            )
            return 2

        for position, item in enumerate(chosen, start=1):
            final.append(
                {
                    **item,
                    "trackSlug": slug,
                    "trackTitle": track["title"],
                    "outcome": track["outcome"],
                    "practice": track["practice"],
                    "trackPosition": position,
                    "academyIndex": len(final) + 1,
                    "kind": "micro-course",
                }
            )

        print(
            f"TRACK_READY={slug} ITEMS={len(chosen)}",
            flush=True,
        )

    final = final[: args.target]

    if len(final) < args.target:
        print(
            f"ERROR=ACADEMY_BELOW_TARGET FOUND={len(final)} TARGET={args.target}",
            file=sys.stderr,
        )
        return 3

    output = {
        "schemaVersion": 1,
        "generatedAt":
            datetime.now(timezone.utc).isoformat(),
        "target": args.target,
        "total": len(final),
        "trackCount": len(
            {
                item["trackSlug"]
                for item in final
            }
        ),
        "strategy":
            "500 unique Arabic-language teacher-training micro-courses from real YouTube videos plus Dadyoom professional application tasks.",
        "channelCount": len(
            {
                item["channel"]
                for item in final
            }
        ),
        "trackCounts": {
            track["slug"]: sum(
                1
                for item in final
                if item["trackSlug"] == track["slug"]
            )
            for track in tracks
        },
        "items": final,
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
        f"TEACHER_ACADEMY_TOTAL={len(final)}"
    )
    print(
        f"TEACHER_ACADEMY_UNIQUE={len({item['id'] for item in final})}"
    )
    print(
        f"TEACHER_ACADEMY_TRACKS={output['trackCount']}"
    )
    print(
        f"TEACHER_ACADEMY_CHANNELS={output['channelCount']}"
    )
    print(
        f"OUTPUT={OUT_FILE}"
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
