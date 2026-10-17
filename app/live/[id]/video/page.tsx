import LiveSessionClient from "../LiveSessionClient";

export default async function LegacyVideoPage({ params }: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LiveSessionClient sessionId={id} />;
}
