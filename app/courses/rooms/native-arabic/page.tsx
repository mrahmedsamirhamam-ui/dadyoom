import { permanentRedirect } from "next/navigation";

export default function NativeArabicRoomPage() {
  permanentRedirect("/courses/video-library?room=native");
}
