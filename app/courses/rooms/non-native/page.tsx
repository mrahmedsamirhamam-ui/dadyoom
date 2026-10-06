import { permanentRedirect } from "next/navigation";

export default function NonNativeRoomPage() {
  permanentRedirect("/courses/video-library?room=non-native");
}
