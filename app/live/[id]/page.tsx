import DadyoomNativeClassroom from "./DadyoomNativeClassroom";

export default async function LiveSessionPage({ params }: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DadyoomNativeClassroom sessionId={id} />;
}
