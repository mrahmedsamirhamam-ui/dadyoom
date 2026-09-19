import catalogData from "@/data/video-library/catalog.json";
import ShortsFeed from "./ShortsFeed";

export const revalidate = 3600;

type SafeVideo = {
  id: string;
  title: string;
  channel: string;
  rightsClass: string;
};

type CatalogVideo = {
  id: string;
  title: string;
  channel: string;
  presentation?: string;
  room?: "non-native" | "native" | "both";
};

const catalog =
  catalogData as {
    videos: CatalogVideo[];
  };

function loadVideos(): SafeVideo[] {
  return catalog.videos
    .filter(
      (video) =>
        Boolean(video.id) &&
        video.presentation === "professional",
    )
    .slice(0, 160)
    .map((video) => ({
      id: video.id,
      title: video.title || "فيديو عربي",
      channel: video.channel || "مصدر تعليمي",
      rightsClass: "youtube-embed",
    }));
}

export default function ShortsPage() {
  return (
    <ShortsFeed
      videos={loadVideos()}
    />
  );
}
