#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

root = Path.cwd()

sources_path = (
    root
    / "data"
    / "video-library"
    / "sources.json"
)

catalog_path = (
    root
    / "data"
    / "video-library"
    / "catalog.json"
)

sources_doc = json.loads(
    sources_path.read_text(
        encoding="utf-8"
    )
)

catalog = json.loads(
    catalog_path.read_text(
        encoding="utf-8"
    )
)

sources = {
    source["key"]: source
    for source in sources_doc["sources"]
}

for video in catalog["videos"]:
    source = sources.get(
        video["sourceKey"],
        {}
    )

    video["instructionLanguage"] = (
        source.get(
            "instructionLanguage",
            "mixed",
        )
    )

    video["presentation"] = (
        source.get(
            "presentation",
            "professional",
        )
    )

catalog["roomPolicy"] = {
    "nonNative":
        "room=non-native or room=both",
    "native":
        "room=native or room=both",
    "arabicInstruction":
        "instructionLanguage=arabic",
}

catalog_path.write_text(
    json.dumps(
        catalog,
        ensure_ascii=False,
        indent=2,
    )
    + "\n",
    encoding="utf-8",
)

print("VIDEO_SOURCE_PROFILES=ATTACHED")
