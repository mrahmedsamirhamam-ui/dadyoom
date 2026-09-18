import { promises as fs } from "node:fs";
import path from "node:path";

import ShortsFeed from "./ShortsFeed";

export const revalidate = 3600;

type SafeVideo = {
  id: string;
  title: string;
  channel: string;
  rightsClass: string;
};

async function loadVideos() {
  try {
    const file = path.join(
      process.cwd(),
      "data",
      "videos",
      "safe-youtube-embeds.json"
    );

    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as SafeVideo[];
  } catch {
    return [];
  }
}

export default async function ShortsPage() {
  const videos = await loadVideos();
  return <ShortsFeed videos={videos} />;
}
