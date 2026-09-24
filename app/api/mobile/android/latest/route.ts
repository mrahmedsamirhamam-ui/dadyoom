import { NextResponse } from "next/server";

const REPO = "mrahmedsamirhamam-ui/dadyoom";
const RELEASE_API =
  `https://api.github.com/repos/${REPO}/releases/latest`;
const STABLE_APK =
  `https://github.com/${REPO}/releases/latest/download/Dadyoom-Android-release.apk`;

type GithubRelease = {
  tag_name?: string;
  name?: string;
  published_at?: string;
  html_url?: string;
  assets?: Array<{
    name?: string;
    size?: number;
    browser_download_url?: string;
  }>;
};

function versionFromTag(tag: string): string {
  return tag
    .replace(/^dadyoom-mobile-v/iu, "")
    .replace(/^v/iu, "")
    .trim();
}

export async function GET() {
  try {
    const response = await fetch(
      RELEASE_API,
      {
        headers: {
          Accept:
            "application/vnd.github+json",
          "User-Agent":
            "Dadyoom-Mobile-Updater",
          "X-GitHub-Api-Version":
            "2022-11-28",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "تعذر فحص تحديثات ضاديوم الآن.",
        },
        { status: 503 },
      );
    }

    const release =
      (await response.json()) as GithubRelease;

    const tag =
      String(release.tag_name ?? "").trim();
    const version =
      versionFromTag(tag);

    if (!version) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "لم أجد إصدار Android صالحًا.",
        },
        { status: 503 },
      );
    }

    const apk =
      release.assets?.find(
        (asset) =>
          asset.name ===
          "Dadyoom-Android-release.apk",
      );

    return NextResponse.json(
      {
        ok: true,
        version,
        tag,
        name:
          release.name ||
          `Dadyoom Android ${version}`,
        publishedAt:
          release.published_at ?? null,
        downloadUrl:
          apk?.browser_download_url ||
          STABLE_APK,
        sizeBytes:
          Number(apk?.size ?? 0),
        releaseUrl:
          release.html_url ?? null,
      },
      {
        headers: {
          "Cache-Control":
            "public, max-age=300, s-maxage=300",
        },
      },
    );
  } catch (error) {
    console.error(
      "DADYOOM_ANDROID_UPDATE_CHECK_ERROR",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "تعذر فحص تحديثات ضاديوم الآن.",
      },
      { status: 503 },
    );
  }
}
