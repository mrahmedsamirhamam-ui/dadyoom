
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ضاديوم — بيت العربية الرقمي",
    short_name: "ضاديوم",
    description:
      "منصة ذكية لتعلّم اللغة العربية وتنمية القراءة والكتابة والاستماع والتحدث.",
    start_url: "/",
    display: "standalone",
    background_color: "#fffdf7",
    theme_color: "#0f766e",
    lang: "ar",
    dir: "rtl",
  };
}
