import { redirect } from "next/navigation";

// Preserve existing lesson/meeting links without connecting to LiveKit.
// Authorized users can enter the independent Dadyoom Classroom at /live/:id.
export default async function DeprecatedVideoPage({ params }: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect("/live/" + encodeURIComponent(id));
}
