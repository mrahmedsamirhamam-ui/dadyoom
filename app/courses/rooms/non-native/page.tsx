import { redirect } from "next/navigation";

export default function NonNativeRoomPage() {
  redirect("/courses/video-library?room=non-native");
}
